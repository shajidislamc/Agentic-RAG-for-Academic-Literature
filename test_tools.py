from tools import search_arxiv

print("Testing ArXiv API")
arxiv_res =  search_arxiv("transformer attention optimization", max_results=2)
for paper in arxiv_res:
    print(f"[{paper['source']}] {paper['title']} ({paper['published']})")
    print(f"URL: {paper['pdf_url']}\n")
