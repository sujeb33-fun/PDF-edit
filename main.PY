import os
from tkinter import filedialog, messagebox
from gui import PDFEditorGUI
from pdf_engine import PDFEngine

class AppController:
    def __init__(self):
        self.gui = PDFEditorGUI()
        self.engine = PDFEngine()
        self.current_file_path = None

        self.gui.btn_open.configure(command=self.open_file)
        self.gui.btn_save.configure(command=self.save_file)

    def open_file(self):
        file_path = filedialog.askopenfilename(filetypes=[("PDF 檔案", "*.pdf")])
        if not file_path:
            return

        self.current_file_path = file_path
        total_pages = self.engine.load_pdf(file_path)
        if total_pages > 0:
            pil_img, pdf_w, pdf_h = self.engine.get_page_image(page_num=0)
            self.gui.display_page_image(pil_img, pdf_w, pdf_h)
            self.gui.btn_save.configure(state="normal")

    def save_file(self):
        # 透過 get_final_pdf_data() 取得畫框與文字模組資料
        rect_data, text_data = self.gui.get_final_pdf_data()
        
        # 檢查是否有新增任何內容
        if not rect_data and not text_data:
            messagebox.showwarning("提示", "尚未進行任何畫框或新增文字模組！")
            return

        if not self.current_file_path:
            return

        answer = messagebox.askyesnocancel(
            "儲存檔案", "要直接【覆蓋原本的檔案】嗎？\n\n點選「是」：直接覆蓋原檔\n點選「否」：另存新檔\n點選「取消」：放棄"
        )

        if answer is None:
            return

        if answer:  # 直接覆蓋原檔
            temp_path = self.current_file_path + ".tmp"
            success = self.engine.apply_edits_and_save(0, rect_data, text_data, temp_path)
            if success:
                self.engine.doc.close()  # 釋放原檔鎖定
                os.replace(temp_path, self.current_file_path)  # 替換原檔
                messagebox.showinfo("成功", f"已成功覆蓋原檔案：\n{self.current_file_path}")
                self.engine.load_pdf(self.current_file_path)  # 重新載入
        else:  # 另存新檔
            save_path = filedialog.asksaveasfilename(
                defaultextension=".pdf", 
                filetypes=[("PDF 檔案", "*.pdf")],
                initialfile="edited_" + os.path.basename(self.current_file_path)
            )
            if not save_path:
                return

            success = self.engine.apply_edits_and_save(0, rect_data, text_data, save_path)
            if success:
                messagebox.showinfo("成功", f"已另存新檔至：\n{save_path}")

    def run(self):
        self.gui.mainloop()

if __name__ == "__main__":
    app = AppController()
    app.run()