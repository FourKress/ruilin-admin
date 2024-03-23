import { useEffect, useState } from 'react'
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import { Spin } from 'antd'

import { uploadFile } from '@/utils/fileUtils.ts'

import '@wangeditor/editor/dist/css/style.css'

function MyEditor({
  onUpdate,
  content
}: {
  onUpdate: (html: string, text: string | undefined, imageKeys: string[]) => void
  content: string
}) {
  const [loading, setLoading] = useState<boolean>(false)
  const [editor, setEditor] = useState<IDomEditor | null>(null) // TS 语法
  const [html, setHtml] = useState<string>(content)
  const [uploadImageList, setUploadImageList] = useState<string[]>([])

  const toolbarConfig: Partial<IToolbarConfig> = {} // TS 语法
  toolbarConfig.excludeKeys = [
    'fullScreen',
    'emotion',
    'group-video',
    'blockquote',
    'code',
    'codeBlock',
    'insertTable',
    'group-more-style'
  ]
  toolbarConfig.insertKeys = {
    index: 6,
    keys: ['through', 'sup', 'sub', 'clearStyle']
  }

  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入内容...',
    MENU_CONF: {
      uploadImage: {
        customUpload: async (file: File, insertFn: any) => {
          const { name } = file
          const objectKey = `${Date.now()}_${name}`
          console.log(objectKey)
          console.log([...uploadImageList, objectKey])
          setUploadImageList([...uploadImageList, objectKey])
          setLoading(true)
          await uploadFile(file, objectKey, 'blog')
          const src = `https://assets.vinnhair.com/blog/${objectKey}`
          insertFn(src, objectKey, src)
        }
      },
      insertImage: {
        onInsertedImage: async () => {
          setLoading(false)
        }
      }
    }
  }

  useEffect(() => {
    setHtml(content)
  }, [content])

  useEffect(() => {
    return () => {
      if (editor == null) return
      editor.destroy()
      setEditor(null)
    }
  }, [editor])

  return (
    <Spin spinning={loading}>
      <div style={{ border: '1px solid #ddd', zIndex: 9 }}>
        <Toolbar
          editor={editor}
          defaultConfig={toolbarConfig}
          mode="default"
          style={{ borderBottom: '1px solid #ddd' }}
        />
        <Editor
          defaultConfig={editorConfig}
          value={html}
          onCreated={setEditor}
          onChange={(editor) => {
            const imageKeys = editor.getElemsByType('image')?.map((d: any) => d.alt)
            onUpdate(editor.getHtml(), editor?.getText(), imageKeys)
          }}
          mode="default"
          style={{ height: '400px', overflowY: 'hidden' }}
        />
      </div>
    </Spin>
  )
}

export default MyEditor
