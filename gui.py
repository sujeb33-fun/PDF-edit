import tkinter as tk
import customtkinter as ctk
from PIL import ImageTk

ctk.set_appearance_mode("System")
ctk.set_default_color_theme("blue")

class PDFEditorGUI(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("PDF 矩形標註與文字模組工具")
        self.geometry("1320x750")

        # 狀態變數
        self.start_x = None
        self.start_y = None
        self.current_rect_id = None
        
        # 拖曳狀態記錄
        self.drag_data = {"item": None, "x": 0, "y": 0}
        
        self.drawn_rects_canvas = []
        self.drawn_rects_pdf = []      # 畫框記錄
        self.text_modules_canvas = []  # 畫布上的文字模組紀錄
        
        self.scale_factor = 1.0
        self.tk_img = None

        self.COLOR_MAP = {
            "藍": (0, 0.4, 0.8), "紅": (1, 0, 0), "綠": (0, 0.6, 0.2), 
            "黑": (0, 0, 0), "黃": (1, 0.9, 0.2), "橘": (1, 0.5, 0), "白": (1, 1, 1), "透明 (無填滿)": None
        }

        self.CANVAS_COLOR_MAP = {
            "藍": "#0066CC", "紅": "#FF5555", "綠": "#33CC55", 
            "黑": "#000000", "黃": "#FFDD33", "橘": "#FF8800", "白": "#FFFFFF", "透明 (無填滿)": ""
        }

        self.BORDER_WIDTH_MAP = {
            "無框線": 0, "細線 (1pt)": 1, "中線 (2pt)": 2, "粗線 (4pt)": 4
        }

        self._init_ui()

    def _init_ui(self):
        self.top_frame = ctk.CTkFrame(self, height=50)
        self.top_frame.pack(fill="x", padx=10, pady=5)

        # 1. 開啟 PDF
        self.btn_open = ctk.CTkButton(self.top_frame, text="開啟 PDF", width=80)
        self.btn_open.pack(side="left", padx=5, pady=5)

        # 2. 模式選擇
        self.mode_label = ctk.CTkLabel(self.top_frame, text="模式:")
        self.mode_label.pack(side="left", padx=(10, 2), pady=5)
        
        self.mode_option = ctk.CTkOptionMenu(
            self.top_frame, values=["新增文字模組", "畫矩形框"], width=110, command=self.on_mode_change
        )
        self.mode_option.pack(side="left", padx=2, pady=5)

        # 3. 顏色選單
        self.color_label = ctk.CTkLabel(self.top_frame, text="顏色:")
        self.color_label.pack(side="left", padx=(10, 2), pady=5)

        self.color_option = ctk.CTkOptionMenu(
            self.top_frame, values=["藍", "紅", "黑", "綠", "黃", "橘", "白", "透明 (無填滿)"], width=90
        )
        self.color_option.pack(side="left", padx=2, pady=5)

        # 4. 【補回】字型選擇
        self.font_family_label = ctk.CTkLabel(self.top_frame, text="字型:")
        self.font_family_label.pack(side="left", padx=(10, 2), pady=5)

        self.font_family_option = ctk.CTkOptionMenu(
            self.top_frame, values=["微軟正黑體", "標楷體", "新細明體", "Arial"], width=100
        )
        self.font_family_option.pack(side="left", padx=2, pady=5)

        # 5. 大小選擇
        self.font_size_label = ctk.CTkLabel(self.top_frame, text="大小:")
        self.font_size_label.pack(side="left", padx=(10, 2), pady=5)

        self.font_size_option = ctk.CTkOptionMenu(
            self.top_frame, 
            values=["8 pt", "10 pt", "12 pt", "14 pt", "16 pt", "18 pt", "20 pt", "24 pt", "28 pt", "32 pt"],
            width=80
        )
        self.font_size_option.set("16 pt")
        self.font_size_option.pack(side="left", padx=2, pady=5)

        # 6. 框線粗細 (畫矩形框模式用)
        self.border_label = ctk.CTkLabel(self.top_frame, text="框線:")
        self.border_label.pack(side="left", padx=(10, 2), pady=5)

        self.border_option = ctk.CTkOptionMenu(
            self.top_frame, values=["無框線", "細線 (1pt)", "中線 (2pt)", "粗線 (4pt)"], width=95
        )
        self.border_option.configure(state="disabled")
        self.border_option.pack(side="left", padx=2, pady=5)

        # 7. 復原 / 清除
        self.btn_undo = ctk.CTkButton(
            self.top_frame, text="↩ 復原", fg_color="#EAB308", hover_color="#CA8A04", width=65, command=self.undo_last_shape
        )
        self.btn_undo.pack(side="left", padx=(10, 2), pady=5)

        self.btn_clear = ctk.CTkButton(
            self.top_frame, text="🗑 清除", fg_color="#EF4444", hover_color="#DC2626", width=65, command=self.clear_all_shapes
        )
        self.btn_clear.pack(side="left", padx=2, pady=5)

        # 8. 儲存
        self.btn_save = ctk.CTkButton(
            self.top_frame, text="💾 儲存", fg_color="#22C55E", hover_color="#16A34A", state="disabled", width=80
        )
        self.btn_save.pack(side="left", padx=(10, 5), pady=5)

        # 中央畫布區
        self.canvas_frame = ctk.CTkFrame(self)
        self.canvas_frame.pack(fill="both", expand=True, padx=10, pady=5)

        self.canvas = tk.Canvas(self.canvas_frame, bg="#2b2b2b", highlightthickness=0)
        self.canvas.pack(fill="both", expand=True)

        # 滑鼠事件綁定
        self.canvas.bind("<Button-1>", self.on_button_press)
        self.canvas.bind("<B1-Motion>", self.on_move_press)
        self.canvas.bind("<ButtonRelease-1>", self.on_button_release)

    def on_mode_change(self, choice):
        if choice == "新增文字模組":
            self.border_option.configure(state="disabled")
            self.font_family_option.configure(state="normal")
            self.font_size_option.configure(state="normal")
        else:
            self.border_option.configure(state="normal")
            self.font_family_option.configure(state="disabled")
            self.font_size_option.configure(state="disabled")

    def display_page_image(self, pil_img, pdf_w, pdf_h):
        self.tk_img = ImageTk.PhotoImage(pil_img)
        self.canvas.delete("all")
        self.canvas.create_image(0, 0, image=self.tk_img, anchor="nw")
        
        self.drawn_rects_canvas.clear()
        self.drawn_rects_pdf.clear()
        self.text_modules_canvas.clear()

        self.scale_factor = pdf_w / pil_img.width

    def on_button_press(self, event):
        if not self.tk_img:
            return

        # 點擊到文字時，記錄狀態準備進行拖曳
        clicked_items = self.canvas.find_withtag("current")
        if clicked_items and "movable" in self.canvas.gettags(clicked_items[0]):
            self.drag_data["item"] = clicked_items[0]
            self.drag_data["x"] = event.x
            self.drag_data["y"] = event.y
            return
        
        mode = self.mode_option.get()
        if mode == "新增文字模組":
            dialog = ctk.CTkInputDialog(text="請輸入文字內容：", title="新增文字模組")
            input_text = dialog.get_input()

            if input_text and input_text.strip():
                selected_color_name = self.color_option.get()
                canvas_color = self.CANVAS_COLOR_MAP[selected_color_name] or "#0066CC"
                font_size_pt = int(self.font_size_option.get().replace(" pt", ""))
                font_family_name = self.font_family_option.get()
                canvas_font_size = max(8, int(font_size_pt / self.scale_factor))

                # 在點擊位置建立具有 movable 標籤的文字
                text_id = self.canvas.create_text(
                    event.x, event.y, text=input_text.strip(), anchor="nw",
                    fill=canvas_color, font=(font_family_name, canvas_font_size, "bold"),
                    tags=("movable",)
                )
                
                self.text_modules_canvas.append({
                    "id": text_id,
                    "text": input_text.strip(),
                    "color_name": selected_color_name,
                    "font_size": font_size_pt,
                    "font_family": font_family_name
                })
        else:
            self.start_x, self.start_y = event.x, event.y
            selected_color_name = self.color_option.get()
            canvas_fill = self.CANVAS_COLOR_MAP[selected_color_name]
            selected_border_name = self.border_option.get()
            canvas_border_w = self.BORDER_WIDTH_MAP[selected_border_name]
            outline_color = "red" if canvas_border_w > 0 else ""

            self.current_rect_id = self.canvas.create_rectangle(
                self.start_x, self.start_y, self.start_x, self.start_y, 
                outline=outline_color, fill=canvas_fill, width=canvas_border_w
            )

    def on_move_press(self, event):
        if self.drag_data["item"]:
            dx = event.x - self.drag_data["x"]
            dy = event.y - self.drag_data["y"]
            self.canvas.move(self.drag_data["item"], dx, dy)
            self.drag_data["x"] = event.x
            self.drag_data["y"] = event.y
            return

        if self.mode_option.get() == "畫矩形框" and self.current_rect_id:
            self.canvas.coords(self.current_rect_id, self.start_x, self.start_y, event.x, event.y)

    def on_button_release(self, event):
        if self.drag_data["item"]:
            self.drag_data["item"] = None
            return

        if self.mode_option.get() == "畫矩形框" and self.current_rect_id:
            end_x, end_y = event.x, event.y
            x0, x1 = min(self.start_x, end_x), max(self.start_x, end_x)
            y0, y1 = min(self.start_y, end_y), max(self.start_y, end_y)

            if abs(x1 - x0) > 5 and abs(y1 - y0) > 5:
                pdf_x0, pdf_y0 = x0 * self.scale_factor, y0 * self.scale_factor
                pdf_x1, pdf_y1 = x1 * self.scale_factor, y1 * self.scale_factor
                
                selected_color_name = self.color_option.get()
                pdf_rgb = self.COLOR_MAP[selected_color_name]
                selected_border_name = self.border_option.get()
                pdf_border_w = self.BORDER_WIDTH_MAP[selected_border_name]

                self.drawn_rects_pdf.append(("rect", pdf_x0, pdf_y0, pdf_x1, pdf_y1, pdf_rgb, pdf_border_w))
                self.drawn_rects_canvas.append(self.current_rect_id)
            else:
                self.canvas.delete(self.current_rect_id)
            self.current_rect_id = None

    def get_final_pdf_data(self):
        """ 計算匯出時文字模組的最終 PDF 實際座標與字型資訊 """
        text_pdf_data = []
        for mod in self.text_modules_canvas:
            coords = self.canvas.coords(mod["id"])
            if coords:
                x, y = coords[0], coords[1]
                pdf_x = x * self.scale_factor
                pdf_y = y * self.scale_factor
                rgb = self.COLOR_MAP[mod["color_name"]]
                text_pdf_data.append((pdf_x, pdf_y, mod["text"], rgb, mod["font_size"], mod["font_family"]))
        return self.drawn_rects_pdf, text_pdf_data

    def undo_last_shape(self):
        if self.text_modules_canvas:
            mod = self.text_modules_canvas.pop()
            self.canvas.delete(mod["id"])
        elif self.drawn_rects_canvas:
            cid = self.drawn_rects_canvas.pop()
            self.canvas.delete(cid)
            self.drawn_rects_pdf.pop()

    def clear_all_shapes(self):
        self.canvas.delete("all")
        if self.tk_img:
            self.canvas.create_image(0, 0, image=self.tk_img, anchor="nw")
        self.drawn_rects_canvas.clear()
        self.drawn_rects_pdf.clear()
        self.text_modules_canvas.clear()