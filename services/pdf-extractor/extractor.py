"""PDF extraction logic using PyMuPDF."""

import re
from dataclasses import dataclass, field
from typing import Optional
import fitz  # PyMuPDF


@dataclass
class Section:
    title: str
    content: str
    level: int


@dataclass
class Figure:
    caption: str
    reference: str
    page_number: Optional[int] = None


@dataclass
class Table:
    caption: str
    content: str
    reference: str


@dataclass
class Equation:
    latex: str
    reference: Optional[str] = None
    context: Optional[str] = None


@dataclass
class Reference:
    title: Optional[str] = None
    authors: Optional[list[str]] = None
    year: Optional[str] = None
    venue: Optional[str] = None
    doi: Optional[str] = None
    arxiv_id: Optional[str] = None


@dataclass
class ExtractionResult:
    full_text: str
    sections: list[Section] = field(default_factory=list)
    figures: list[Figure] = field(default_factory=list)
    tables: list[Table] = field(default_factory=list)
    equations: list[Equation] = field(default_factory=list)
    references: list[Reference] = field(default_factory=list)
    error: Optional[str] = None


# Common section headers in academic papers
SECTION_PATTERNS = [
    r"^(?:(\d+(?:\.\d+)*)\s*)?(?:Introduction|Background|Related Work|Methodology|Methods|Experiments|Results|Discussion|Conclusion|Acknowledgments|References|Abstract|Preliminaries|Problem Statement|Approach|Implementation|Evaluation|Analysis|Future Work)(?:\s*\n|$)",
]

FIGURE_CAPTION_PATTERN = r"(?:Figure|Fig\.?)\s*(\d+)[\.:]\s*(.+?)(?=\n\n|\Z)"
TABLE_CAPTION_PATTERN = r"(?:Table)\s*(\d+)[\.:]\s*(.+?)(?=\n\n|\Z)"
EQUATION_PATTERN = r"\$\$([^$]+)\$\$|\\\[([^\]]+)\\\]|\\\(([^)]+)\\\)"


def extract_sections(text: str) -> list[Section]:
    """Extract sections from the document text."""
    sections = []
    lines = text.split("\n")
    current_section = None
    current_content = []

    section_header_re = re.compile(
        r"^(?:(\d+(?:\.\d+)*)\s*)?(?P<title>Introduction|Background|Related Work|Methodology|Methods|Experiments|Results|Discussion|Conclusion|Acknowledgments|References|Abstract|Preliminaries|Problem Statement|Approach|Implementation|Evaluation|Analysis|Future Work)(?:\s*\n|$)",
        re.IGNORECASE | re.MULTILINE,
    )

    for line in lines:
        match = section_header_re.match(line.strip())
        if match:
            if current_section is not None:
                sections.append(
                    Section(
                        title=current_section,
                        content="\n".join(current_content).strip(),
                        level=1,
                    )
                )
            current_section = match.group("title")
            current_content = []
        elif current_section is not None:
            current_content.append(line)

    if current_section is not None:
        sections.append(
            Section(
                title=current_section,
                content="\n".join(current_content).strip(),
                level=1,
            )
        )

    return sections


def extract_figures(text: str) -> list[Figure]:
    """Extract figure captions from the document."""
    figures = []
    matches = re.finditer(FIGURE_CAPTION_PATTERN, text, re.IGNORECASE | re.DOTALL)

    for match in matches:
        fig_num = match.group(1)
        caption = match.group(2).strip()
        figures.append(
            Figure(
                caption=caption,
                reference=f"Figure {fig_num}",
            )
        )

    return figures


def extract_tables(text: str) -> list[Table]:
    """Extract table captions from the document."""
    tables = []
    matches = re.finditer(TABLE_CAPTION_PATTERN, text, re.IGNORECASE | re.DOTALL)

    for match in matches:
        table_num = match.group(1)
        caption = match.group(2).strip()
        tables.append(
            Table(
                caption=caption,
                content="",  # Table content extraction is complex, placeholder
                reference=f"Table {table_num}",
            )
        )

    return tables


def extract_equations(text: str) -> list[Equation]:
    """Extract LaTeX equations from the document."""
    equations = []
    matches = re.finditer(EQUATION_PATTERN, text)

    for match in matches:
        latex = match.group(1) or match.group(2) or match.group(3)
        if latex:
            equations.append(
                Equation(
                    latex=latex.strip(),
                )
            )

    return equations


def extract_references_section(text: str) -> list[Reference]:
    """Extract references from the references section."""
    references = []

    # Find references section
    ref_match = re.search(r"References\s*\n(.+?)(?:\Z|(?:\n\n(?:Appendix|Supplementary)))", text, re.IGNORECASE | re.DOTALL)
    if not ref_match:
        return references

    ref_text = ref_match.group(1)

    # Split by common reference patterns (numbered or bracketed)
    ref_entries = re.split(r"\n\s*(?:\[\d+\]|\d+\.)\s*", ref_text)

    for entry in ref_entries:
        entry = entry.strip()
        if not entry or len(entry) < 20:
            continue

        # Try to extract year
        year_match = re.search(r"\b(19|20)\d{2}\b", entry)
        year = year_match.group(0) if year_match else None

        # Try to extract arXiv ID
        arxiv_match = re.search(r"arXiv[:\s]*(\d{4}\.\d{4,5})", entry, re.IGNORECASE)
        arxiv_id = arxiv_match.group(1) if arxiv_match else None

        # Try to extract DOI
        doi_match = re.search(r"10\.\d{4,}/[^\s]+", entry)
        doi = doi_match.group(0) if doi_match else None

        references.append(
            Reference(
                title=entry[:200] if len(entry) > 200 else entry,
                year=year,
                arxiv_id=arxiv_id,
                doi=doi,
            )
        )

    return references


def extract_pdf(pdf_bytes: bytes) -> ExtractionResult:
    """Extract structured content from a PDF."""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        # Extract full text
        full_text_parts = []
        for page_num, page in enumerate(doc):
            text = page.get_text()
            full_text_parts.append(text)

        full_text = "\n\n".join(full_text_parts)

        # Extract structured elements
        sections = extract_sections(full_text)
        figures = extract_figures(full_text)
        tables = extract_tables(full_text)
        equations = extract_equations(full_text)
        references = extract_references_section(full_text)

        doc.close()

        return ExtractionResult(
            full_text=full_text,
            sections=sections,
            figures=figures,
            tables=tables,
            equations=equations,
            references=references,
        )

    except Exception as e:
        return ExtractionResult(
            full_text="",
            error=str(e),
        )
