import fitz  # PyMuPDF
from PIL import Image
import io
import os

class PDFEngine:
    def __init__(self):
        self.doc = None
        self.current_page_num = 0

        self.FONT_MAP = {
            "標楷體": "C:/Windows/Fonts/kaiu.ttf",
            "微軟正黑體": "C:/Windows/Fonts/msjh.ttc",
            "新細明體": "C:/Windows/Fonts/mingliu.ttc",
            "Arial": "C:/Windows/Fonts/arial.ttf"
        }

    def load_pdf(self, file_path):
        self.doc = fitz.open(file_path)
        self.current_page_num = 0
        return len(self.doc)

    def get_page_image(self, page_num=0, zoom=1.5):
        if not self.doc:
            return None, 0, 0
        page = self.doc[page_num]
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        img_data = pix.tobytes("png")
        return Image.open(io.BytesIO(img_data)), page.rect.width, page.rect.height

    def apply_edits_and_save(self, page_num, rect_list, text_list, output_path):
        """ 套用畫框與文字模組並寫入檔案 """
        if not self.doc:
            return False
            
        page = self.doc[page_num]

        # 1. 處理矩形遮罩 / 畫框
        for item in rect_list:
            _, x0, y0, x1, y1, fill_color, border_w = item
            fitz_rect = fitz.Rect(x0, y0, x1, y1)
            
            opacity = 1.0 if fill_color == (1, 1, 1) else (0.35 if fill_color else 0.0)
            border_color = (1, 0, 0) if border_w > 0 else None

            page.draw_rect(
                fitz_rect, color=border_color, fill=fill_color, width=border_w, overlay=True, fill_opacity=opacity
            )

        # 2. 處理文字模組寫入
        for item in text_list:
            pdf_x, pdf_y, text_content, rgb_color, font_size, font_family = item
            
            # 建立文字輸入框區域 (以點擊位置為左上角)
            rect = fitz.Rect(pdf_x, pdf_y, pdf_x + (len(text_content) * font_size * 1.5), pdf_y + (font_size * 2))
            color = rgb_color if rgb_color else (0, 0, 0)

            font_path = self.FONT_MAP.get(font_family, "C:/Windows/Fonts/msjh.ttc")

            if os.path.exists(font_path):
                page.insert_textbox(
                    rect,
                    text_content,
                    fontsize=font_size,
                    fontfile=font_path,
                    fontname="CustomFont",
                    color=color,
                    align=0
                )
            else:
                page.insert_textbox(
                    rect,
                    text_content,
                    fontsize=font_size,
                    color=color,
                    align=0
                )

        self.doc.save(output_path, garbage=4, deflate=True)
        return True