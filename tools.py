import arxiv, requests, time
from typing import List, Dict, Any

def search_arxiv(query: str, max_results: int=3) -> List[Dict[str, Any]]:
    """Search ArXiv for papers and return structured metadata."""
    client = arxiv.Client()
    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.Relevance
    )

    results = []
    for paper in client.results(search):
        results.append({
            "source": "ArXiv",
            "title": paper.title,
            "authors": [a.name for a in paper.authors[:3]],
            "summary": paper.summary.replace("\n", " "),
            "pdf_url": paper.pdf_url,
            "published": paper.published.strftime("%Y-%m-%d")
        })
    return results

    