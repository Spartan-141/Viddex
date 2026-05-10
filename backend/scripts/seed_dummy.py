from app.database import SessionLocal, engine, Base
from app.models import Movie, VideoLink
import uuid

def gen_uuid():
    return str(uuid.uuid4())

def populate_dummy_data():
    db = SessionLocal()
    
    # Check if we already have data
    if db.query(Movie).count() > 0:
        print("Database already has data. Skipping...")
        db.close()
        return

    print("Populating dummy data...")
    
    dummy_movies = [
        {
            "tmdb_id": 27205,
            "title": "Inception",
            "original_title": "Inception",
            "overview": "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: \"inception\", the implantation of another person's idea into a target's subconscious.",
            "poster_path": "/oYuLEt6vSrnS7fdzQCtGv869oxE.jpg",
            "backdrop_path": "/8ZTPjS7Z7p7vYvub9le9uB9C9vX.jpg",
            "tmdb_rating": 8.4,
            "tmdb_vote_count": 35000,
            "release_date": "2010-07-15",
            "runtime": 148,
            "original_language": "en"
        },
        {
            "tmdb_id": 157336,
            "title": "Interstellar",
            "original_title": "Interstellar",
            "overview": "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
            "poster_path": "/gEU2QniE6EUnUvP6lzVl7pY1YQ1.jpg",
            "backdrop_path": "/p2fS6S6vUR69trH9u8G2uDIp1Fy.jpg",
            "tmdb_rating": 8.4,
            "tmdb_vote_count": 33000,
            "release_date": "2014-11-05",
            "runtime": 169,
            "original_language": "en"
        },
        {
            "tmdb_id": 299534,
            "title": "Avengers: Endgame",
            "original_title": "Avengers: Endgame",
            "overview": "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to undo Thanos' actions and restore order to the universe.",
            "poster_path": "/or06vS30BvW3pTbs97opmCLqPbC.jpg",
            "backdrop_path": "/7Ry6SZdHYwPmaIgnyO7Np3ZzYn.jpg",
            "tmdb_rating": 8.2,
            "tmdb_vote_count": 24000,
            "release_date": "2019-04-24",
            "runtime": 181,
            "original_language": "en"
        }
    ]

    for m_data in dummy_movies:
        movie = Movie(
            id=gen_uuid(),
            **m_data
        )
        db.add(movie)
        db.flush()
        
        # Add a dummy link
        link = VideoLink(
            id=gen_uuid(),
            movie_id=movie.id,
            stream_url="https://www.w3schools.com/html/mov_bbb.mp4", # Open source test video
            quality="FHD",
            language="LAT",
            title="Server 1"
        )
        db.add(link)
        print(f"Added: {movie.title}")

    db.commit()
    db.close()
    print("Done!")

if __name__ == "__main__":
    populate_dummy_data()
