export const fetchBookByISBN = async (rawIsbn: string) => {
  const isbn = rawIsbn.replace(/[-\s]/g, "")

  // Google Books API 呼び出し
  const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
  const data = await response.json()

  if (!data.items || data.items.length === 0) {
    throw new Error("書籍情報が見つかりませんでした（Google Books）")
  }

  const info = data.items[0].volumeInfo

  return {
    title: info.title || "",
    author: (info.authors && info.authors[0]) || "",
    description: info.description || "",
  }
}
