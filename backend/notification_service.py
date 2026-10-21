import os
import sys
import json
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional, Set

# Ensure backend directory is in sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__)))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from database import get_db_connection

# Suppress unhandled exceptions in plyer Windows balloon tip background thread
try:
    import plyer.platforms.win.libs.balloontip as _bt
    _orig_notify = _bt.WindowsBalloonTip.notify
    def _safe_notify(self, title, msg, app_name=''):
        try:
            return _orig_notify(self, title, msg, app_name)
        except Exception:
            pass
    _bt.WindowsBalloonTip.notify = _safe_notify
except Exception:
    pass

# In-memory subscriber queues for SSE streaming
SSE_CLIENT_QUEUES: Set[asyncio.Queue] = set()

def send_desktop_notification(title: str, message: str, app_name: str = "AxiomFlow") -> bool:
    """
    Sends a native desktop notification using Python's `plyer` module.
    Falls back gracefully if desktop notification environment is unavailable.
    """
    try:
        from plyer import notification
        # Limit message length for desktop balloon notification
        clean_msg = message.strip()
        if len(clean_msg) > 200:
            clean_msg = clean_msg[:197] + "..."
            
        notification.notify(
            title=title or "AxiomFlow Workflow Notification",
            message=clean_msg,
            app_name=app_name,
            timeout=6
        )
        print(f"[NOTIFIER] Desktop notification triggered via plyer: '{title}' - '{clean_msg}'")
        return True
    except Exception as e:
        print(f"[WARNING] Desktop notification via plyer failed: {e}")
        return False


def record_notification(message: str, status: str = "info", task_id: Optional[str] = None) -> Optional[int]:
    """
    Inserts a record into axiomflow_db.notifications table.
    CRITICAL RULE: Notifications are ONLY triggered after execution terminates
    (status = completed or failed/rejected/paused). Never on startup or intermediate steps.
    """
    conn = None
    inserted_id = None
    now = datetime.now()
    cur_date = now.date()
    cur_time = now.time().strftime("%H:%M:%S")

    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO `notifications` (`date`, `time`, `message`, `status`, `created_at`)
                VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP);
                """,
                (cur_date, cur_time, message, status)
            )
            conn.commit()
            inserted_id = cur.lastrowid
    except Exception as e:
        print(f"[WARNING] Failed to record notification to database: {e}")
    finally:
        if conn:
            conn.close()

    # Trigger desktop notification via plyer
    desktop_title = "AxiomFlow: Workflow Update"
    st_lower = (status or "").lower()
    if st_lower in ("succeeded", "completed"):
        desktop_title = "AxiomFlow: Workflow Completed 🚀"
    elif st_lower in ("failed", "rejected"):
        desktop_title = "AxiomFlow: Workflow Alert ⚠️"
    elif st_lower == "paused":
        desktop_title = "AxiomFlow: Workflow Paused ⏸️"

    send_desktop_notification(title=desktop_title, message=message)

    # Broadcast notification to all active SSE client streams
    payload = {
        "id": str(inserted_id) if inserted_id else f"notif_{int(now.timestamp())}",
        "date": str(cur_date),
        "time": str(cur_time),
        "message": message,
        "status": status,
        "task_id": task_id,
        "created_at": now.strftime("%Y-%m-%d %H:%M:%S")
    }
    broadcast_sse_event("notification", payload)

    return inserted_id


def broadcast_sse_event(event_type: str, data: Dict[str, Any]):
    """Pushes an SSE event packet to all registered async queues."""
    packet = {
        "type": event_type,
        "data": data,
        "timestamp": datetime.now().isoformat()
    }
    dead_queues = set()
    for q in list(SSE_CLIENT_QUEUES):
        try:
            q.put_nowait(packet)
        except asyncio.QueueFull:
            dead_queues.add(q)
        except Exception:
            dead_queues.add(q)

    for dq in dead_queues:
        SSE_CLIENT_QUEUES.discard(dq)


async def sse_event_stream(request):
    """
    Asynchronous generator yielding Server-Sent Events (SSE) compliant with W3C spec.
    Keeps connection alive with periodic pings.
    """
    client_queue = asyncio.Queue(maxsize=50)
    SSE_CLIENT_QUEUES.add(client_queue)
    print(f"[SSE] New client subscribed. Total active SSE listeners: {len(SSE_CLIENT_QUEUES)}")

    try:
        # Initial handshake ping
        yield f"event: connect\ndata: {json.dumps({'message': 'Connected to AxiomFlow SSE stream', 'active_clients': len(SSE_CLIENT_QUEUES)})}\n\n"

        while True:
            # Check if client disconnected
            if await request.is_disconnected():
                break

            try:
                # Wait for next event with a 15-second heartbeat timeout
                event = await asyncio.wait_for(client_queue.get(), timeout=15.0)
                event_name = event.get("type", "message")
                event_data = json.dumps(event.get("data", {}))
                yield f"event: {event_name}\ndata: {event_data}\n\n"
            except asyncio.TimeoutError:
                # Send keep-alive ping comment
                yield ": ping\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        SSE_CLIENT_QUEUES.discard(client_queue)
        print(f"[SSE] Client disconnected. Total active SSE listeners: {len(SSE_CLIENT_QUEUES)}")


def fetch_notifications(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves real-time alert notifications directly from RDS MySQL `notifications` table."""
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT `id`, `date`, `time`, `message`, `status`, `created_at`
                FROM `notifications`
                ORDER BY `created_at` DESC, `id` DESC
                LIMIT %s;
                """,
                (limit,)
            )
            rows = cur.fetchall()
            results = []
            for r in rows:
                c_at = r.get("created_at")
                formatted_cat = c_at.strftime("%Y-%m-%d %H:%M:%S") if c_at else "---"
                time_val = r.get("time")
                # Format time string safely from timedelta or time object
                formatted_time = str(time_val) if time_val is not None else "---"
                
                results.append({
                    "id": str(r.get("id")),
                    "date": str(r.get("date")) if r.get("date") else "---",
                    "time": formatted_time,
                    "message": r.get("message") or "---",
                    "status": r.get("status") or "---",
                    "created_at": formatted_cat
                })
            return results
    except Exception as e:
        print(f"[ERROR] Failed to fetch notifications from database: {e}")
        return []
    finally:
        if conn:
            conn.close()


def clear_all_notifications() -> bool:
    """Deletes all notification entries from axiomflow_db.notifications."""
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("DELETE FROM `notifications`;")
            conn.commit()
            return True
    except Exception as e:
        print(f"[ERROR] Failed to clear notifications: {e}")
        return False
    finally:
        if conn:
            conn.close()
