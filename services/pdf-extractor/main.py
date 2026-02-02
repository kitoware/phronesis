"""FastAPI service for PDF extraction using PyMuPDF."""

from typing import Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import httpx

from extractor import extract_pdf, ExtractionResult

app = FastAPI(
    title="PDF Extractor Service",
    description="Extract structured content from academic PDFs using PyMuPDF",
    version="1.0.0",
)


class SectionResponse(BaseModel):
    title: str
    content: str
    level: int


class FigureResponse(BaseModel):
    caption: str
    reference: str
    pageNumber: Optional[int] = None


class TableResponse(BaseModel):
    caption: str
    content: str
    reference: str


class EquationResponse(BaseModel):
    latex: str
    reference: Optional[str] = None
    context: Optional[str] = None


class ReferenceResponse(BaseModel):
    title: Optional[str] = None
    authors: Optional[list[str]] = None
    year: Optional[str] = None
    venue: Optional[str] = None
    doi: Optional[str] = None
    arxivId: Optional[str] = None


class ExtractionResponse(BaseModel):
    fullText: str
    sections: list[SectionResponse]
    figures: list[FigureResponse]
    tables: list[TableResponse]
    equations: list[EquationResponse]
    references: list[ReferenceResponse]
    error: Optional[str] = None


class UrlExtractionRequest(BaseModel):
    url: str


def result_to_response(result: ExtractionResult) -> ExtractionResponse:
    """Convert internal ExtractionResult to API response."""
    return ExtractionResponse(
        fullText=result.full_text,
        sections=[
            SectionResponse(title=s.title, content=s.content, level=s.level)
            for s in result.sections
        ],
        figures=[
            FigureResponse(
                caption=f.caption, reference=f.reference, pageNumber=f.page_number
            )
            for f in result.figures
        ],
        tables=[
            TableResponse(caption=t.caption, content=t.content, reference=t.reference)
            for t in result.tables
        ],
        equations=[
            EquationResponse(latex=e.latex, reference=e.reference, context=e.context)
            for e in result.equations
        ],
        references=[
            ReferenceResponse(
                title=r.title,
                authors=r.authors,
                year=r.year,
                venue=r.venue,
                doi=r.doi,
                arxivId=r.arxiv_id,
            )
            for r in result.references
        ],
        error=result.error,
    )


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/extract", response_model=ExtractionResponse)
async def extract_from_file(file: UploadFile = File(...)):
    """Extract content from an uploaded PDF file."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    pdf_bytes = await file.read()
    result = extract_pdf(pdf_bytes)

    if result.error:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {result.error}")

    return result_to_response(result)


@app.post("/extract-url", response_model=ExtractionResponse)
async def extract_from_url(request: UrlExtractionRequest):
    """Extract content from a PDF at the given URL."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(
                request.url,
                headers={"User-Agent": "Phronesis/1.0 (research-agent)"},
                follow_redirects=True,
            )
            response.raise_for_status()
            pdf_bytes = response.content
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch PDF: {str(e)}")

    result = extract_pdf(pdf_bytes)

    if result.error:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {result.error}")

    return result_to_response(result)


@app.post("/extract-batch", response_model=list[ExtractionResponse])
async def extract_batch(urls: list[str]):
    """Extract content from multiple PDF URLs."""
    results = []

    async with httpx.AsyncClient(timeout=60.0) as client:
        for url in urls:
            try:
                response = await client.get(
                    url,
                    headers={"User-Agent": "Phronesis/1.0 (research-agent)"},
                    follow_redirects=True,
                )
                response.raise_for_status()
                pdf_bytes = response.content
                result = extract_pdf(pdf_bytes)
                results.append(result_to_response(result))
            except Exception as e:
                results.append(
                    ExtractionResponse(
                        fullText="",
                        sections=[],
                        figures=[],
                        tables=[],
                        equations=[],
                        references=[],
                        error=str(e),
                    )
                )

    return results


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
