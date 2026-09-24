import pymupdf
import os
import numpy as np

p = r"C:\Users\HP\Downloads\PakParcha_Class_Notes\Class 12\Biology\Unit_15_Long Questions.pdf"
doc = pymupdf.open(p)
print("Total pages:", len(doc))

for i in range(min(4, len(doc))):
    page = doc[i]
    pix = page.get_pixmap(dpi=72)
    arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, pix.n))
    
    # Save image to artifact
    out_img = f"C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\09585448-744b-4194-9227-9f8855d27109\\scratch\\page_{i+1}.png"
    pix.save(out_img)
    
    # Compute stats
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    mean_val = np.mean(arr)
    is_uniform_grey = (np.std(arr) < 5)
    print(f"Page {i+1}: Mean={mean_val:.2f}, StdDev={np.std(arr):.2f}, UniformGrey={is_uniform_grey}, Saved to: page_{i+1}.png")

doc.close()
