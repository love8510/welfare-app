'use client'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/hooks/use-toast'

interface Props {
  bucket: string
  path: string
  currentUrl: string | null
  onUpload: (url: string) => void
  onDelete: () => void
  label: string
  accept?: string
}

export function ImageUploader({ currentUrl, onUpload, onDelete, label, accept = '.jpg,.gif' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast('파일 크기는 2MB 이하만 가능합니다', 'destructive')
      return
    }

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, mimeType: file.type, label }),
        })
        const { url, error } = await res.json()
        if (error) throw new Error(error)
        setPreview(url)
        onUpload(url)
        toast('이미지가 업로드되었습니다')
      }
      reader.readAsDataURL(file)
    } catch (err) {
      toast('업로드 실패: ' + (err as Error).message, 'destructive')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium w-20">{label}</span>
      <div className="w-24 h-16 border border-gray-200 rounded flex items-center justify-center bg-gray-50 overflow-hidden">
        {preview ? (
          <img src={preview} alt={label} className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs text-gray-400">미리보기</span>
        )}
      </div>
      <div className="flex gap-2 items-center">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? '업로드중...' : '찾아보기'}
        </Button>
        {preview && (
          <Button type="button" variant="destructive" size="sm" onClick={() => { setPreview(null); onDelete() }}>
            삭제
          </Button>
        )}
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
        <span className="text-xs text-gray-400">(jpg, gif만 가능)</span>
      </div>
    </div>
  )
}
