export const fetchBookByISBN = async (rawIsbn: string) => {
  const isbn = rawIsbn.replace(/[-\s]/g, "")

  // Google Books API 呼び出し
  const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
  const data = await response.json()

  if (!data.items || data.items.length === 0) {
    throw new Error("書籍情報が見つかりませんでした（Google Books）")
  }

  const info = data.items[0].volumeInfo

  // 表紙画像URLを取得（高解像度を優先）
  let coverImageUrl = ""
  if (info.imageLinks) {
    // 優先順位: extraLarge > large > medium > small > thumbnail
    coverImageUrl = info.imageLinks.extraLarge ||
                   info.imageLinks.large ||
                   info.imageLinks.medium ||
                   info.imageLinks.small ||
                   info.imageLinks.thumbnail ||
                   ""
    
    // HTTPSに変換（Google Books APIはHTTPで返すことがある）
    if (coverImageUrl) {
      coverImageUrl = coverImageUrl.replace(/^http:/, 'https:')
    }
  }

  return {
    title: info.title || "",
    author: (info.authors && info.authors[0]) || "",
    description: info.description || "",
    coverImageUrl: coverImageUrl,
  }
}
