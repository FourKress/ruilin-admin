import { useEffect, useState } from 'react'
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'

import '@wangeditor/editor/dist/css/style.css' // 引入 css

function MyEditor({
  onUpdate,
  content
}: {
  onUpdate: (html: string, text: string | undefined) => void
  content: string
}) {
  // editor 实例
  const [editor, setEditor] = useState<IDomEditor | null>(null) // TS 语法
  // 编辑器内容
  const [html, setHtml] = useState<string>(content)

  // 工具栏配置
  const toolbarConfig: Partial<IToolbarConfig> = {} // TS 语法
  toolbarConfig.excludeKeys = ['fullScreen', 'emotion', 'group-video']

  // 编辑器配置
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入内容...'
  }

  useEffect(() => {
    setHtml(content)
  }, [content])

  // 及时销毁 editor ，重要！
  useEffect(() => {
    return () => {
      if (editor == null) return
      editor.destroy()
      setEditor(null)
    }
  }, [editor])

  useEffect(() => {
    onUpdate(html, editor?.getText())
  }, [html])

  return (
    <>
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
            onUpdate(editor.getHtml(), editor?.getText())
          }}
          mode="default"
          style={{ height: '400px', overflowY: 'hidden' }}
        />
      </div>
    </>
  )
}

export default MyEditor
