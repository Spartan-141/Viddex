# app/routers/admin.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Movie, Series, Episode, User, Report
from ..schemas import AdminStats
from ..auth import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStats)
def get_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    return AdminStats(
        total_movies=db.query(Movie).count(),
        total_series=db.query(Series).count(),
        total_episodes=db.query(Episode).count(),
        total_users=db.query(User).count(),
        pending_reports=db.query(Report).filter(Report.status == "pending").count(),
    )


@router.get("/users")
def list_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "role": u.role,
            "created_at": u.created_at,
        }
        for u in users
    ]


@router.put("/users/{user_id}/role")
def set_user_role(
    user_id: str,
    role: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.role = role
    db.commit()
    return {"message": f"Rol actualizado a '{role}'", "user_id": user_id}


@router.get("/reports")
def list_reports(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Report).order_by(Report.created_at.desc()).all()


@router.post("/reports/{report_id}/resolve")
def resolve_report(
    report_id: str, db: Session = Depends(get_db), _=Depends(require_admin)
):
    from datetime import datetime

    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    report.status = "resolved"
    report.resolved_at = datetime.utcnow()
    db.commit()
    return {"message": "Reporte resuelto"}
