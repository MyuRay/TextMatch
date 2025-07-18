import requests
from bs4 import BeautifulSoup
import csv

url = "https://ja.wikipedia.org/wiki/日本の大学一覧_(五十音順)"
res = requests.get(url)
res.encoding = "utf-8"  # 日本語ページ対策
soup = BeautifulSoup(res.text, "html.parser")

universities = []

for ul in soup.select("ul"):
    for li in ul.select("li"):
        a_tag = li.find("a")
        if a_tag and "大学" in a_tag.text:
            name = a_tag.text.strip().split(" ")[0]  # 空白で分割して先頭だけ
            if name not in universities:
                universities.append(name)

# ソート＆重複削除
universities = sorted(set(universities))

# CSVに保存
with open("universities.csv", mode="w", encoding="utf-8", newline="") as file:
    writer = csv.writer(file)
    writer.writerow(["University Name"])
    for uni in universities:
        writer.writerow([uni])

print(f"{len(universities)} 件の大学名を universities.csv に保存しました。")
