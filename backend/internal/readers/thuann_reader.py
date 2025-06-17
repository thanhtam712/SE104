import sys
from pathlib import Path
from typing import Optional, List, Dict

from .nonpdf import convert, convert_imgs


class ThuaNNPdfReader:
    """PDF parser and Image parser."""

    def load_data(
        self,
        file: Path,
        extra_info: Optional[Dict] = None,
        **kwargs,
    ) -> list[str]:
        """Parse file pdf."""
        print("Loading data from file:", file)

        if file.suffix == ".pdf":
            documents = convert(str(file))
        else:
            raise ValueError(
                f"Unsupported file type: {file.suffix}. Only .pdf files are supported."
            )

        return documents

    def load_imgs_data(self, files: list[Path], **kwargs) -> list[str]:
        """Parse image files."""

        return convert_imgs(files)
