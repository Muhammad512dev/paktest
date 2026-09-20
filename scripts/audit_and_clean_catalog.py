import json
import re

JUNK_KEYWORDS = [
    'reply', 'disclaimer', 'dmca', 'policy', 'privacy', 'about us', 'contact us', 
    'advertisement', 'sitemap', 'skip to content', 'menu close', 'toggle website search',
    'view categories', 'extra pages', 'fun quiz', 'download freeilm.com android app',
    'download freeilm', 'test papers', 'past papers'
]

# Patterns for general chapter hub navigation pages that are not direct note pages:
# E.g. "Chapter 9", "Chapter 10", "Unit 1", "Chapter 14 (New)" where it has no qualifier like MCQs, Long, Short, Numerical, Solutions, Notes, etc.
def is_junk_entry(item):
    title = item.get('title', '').strip()
    url = item.get('url', '').strip()
    
    title_lower = title.lower()
    url_lower = url.lower()
    
    # 1. Check exact junk keywords
    for junk in JUNK_KEYWORDS:
        if junk in title_lower:
            return True, f"Matched junk keyword: '{junk}'"
        if f"/{junk}" in url_lower or f"-{junk}" in url_lower or f"={junk}" in url_lower:
            return True, f"Matched junk url keyword: '{junk}'"
            
    # 2. Check if title is purely a chapter hub link like "Chapter 1", "Chapter 10", "Unit 1", "Chapter 14 (New)"
    # without any note indicators (MCQ, Short, Long, Exercise, Numerical, Notes, Solutions, Surah, Nazam, Ghazal, Lesson, Sabaq, etc.)
    bare_chapter = re.match(r'^(?:unit|chapter|ch)\s*\d+\s*(?:\(new\))?$', title_lower)
    if bare_chapter:
        return True, "Bare chapter hub link without note content"
        
    return False, ""

def clean_catalog():
    cat_path = 'universal_notes_downloader/multi_class_catalog.json'
    with open(cat_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
        
    cleaned_catalog = {}
    stats_before = {}
    stats_after = {}
    removed_items = []
    
    for cls_name, subjects in catalog.items():
        cleaned_catalog[cls_name] = {}
        stats_before[cls_name] = 0
        stats_after[cls_name] = 0
        
        for sub_name, items in subjects.items():
            valid_items = []
            seen_urls = set()
            
            for item in items:
                stats_before[cls_name] += 1
                url = item.get('url', '')
                
                # Check duplicates
                if url in seen_urls:
                    removed_items.append((cls_name, sub_name, item.get('title'), "Duplicate URL"))
                    continue
                seen_urls.add(url)
                
                is_junk, reason = is_junk_entry(item)
                if is_junk:
                    removed_items.append((cls_name, sub_name, item.get('title'), reason))
                else:
                    valid_items.append(item)
                    stats_after[cls_name] += 1
                    
            if valid_items:
                cleaned_catalog[cls_name][sub_name] = valid_items
                
    print("=" * 60)
    print("CATALOG AUDIT & CLEANING SUMMARY")
    print("=" * 60)
    for cls_name in catalog.keys():
        b = stats_before[cls_name]
        a = stats_after[cls_name]
        diff = b - a
        print(f"{cls_name}: {b} items -> {a} clean items (Removed {diff} junk/duplicate links)")
        
    print(f"\nTotal removed junk entries: {len(removed_items)}")
    print("Sample removed items:")
    for cls_name, sub_name, title, reason in removed_items[:15]:
        print(f"  - [{cls_name} > {sub_name}] {title} -> {reason}")
        
    # Save cleaned catalog
    with open(cat_path, 'w', encoding='utf-8') as f:
        json.dump(cleaned_catalog, f, indent=2, ensure_ascii=False)
        
    print(f"\nSuccessfully saved cleaned catalog to: {cat_path}")

if __name__ == '__main__':
    clean_catalog()
