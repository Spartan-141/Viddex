from fastapi import APIRouter, HTTPException, Query
from app.utils.cuevana_scraper import cuevana_scraper

router = APIRouter(prefix="/api/scraper", tags=["scraper"])

@router.get("/cuevana")
async def scrape_cuevana(
    title: str = Query(..., description="Movie title (e.g. 'The Matrix')"),
    year: str = Query(None, description="Release year (e.g. '1999') — improves search accuracy"),
):
    """
    Searches for a movie on Cuevana and returns a direct player link.
    
    The engine uses multiple search strategies:
    - Standard WordPress search with title + year
    - Cuevana's internal search path
    - Direct slug construction from title + year
    
    If Vimeus is available it will be preferred; otherwise the first available server is returned.
    """
    if not title or not title.strip():
        raise HTTPException(status_code=400, detail="Title is required")

    link = await cuevana_scraper.get_fallback_link(title.strip(), year.strip() if year else None)

    if not link:
        raise HTTPException(
            status_code=404,
            detail=f"No fallback link found on Cuevana for '{title}' ({year or 'any year'})"
        )

    return {
        "status": "success",
        "source": "cuevana",
        "title": title,
        "year": year,
        "url": link,
    }
