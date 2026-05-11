import CatalogPage from './CatalogPage'

export function SeriesPageRoute() {
  return <CatalogPage contentType="series" emoji="📺" label="Series" />
}

export function AnimePageRoute() {
  return <CatalogPage contentType="anime" emoji="✨" label="Animes" />
}
