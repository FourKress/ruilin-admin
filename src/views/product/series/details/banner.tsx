import React, { useEffect, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { DndContext, DragEndEvent, PointerSensor, useSensor } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Col, Image, message, Row, Space, Spin, Upload, UploadFile, UploadProps } from 'antd'

import axios from '@/utils/axios.ts'
import { uploadFile } from '@/utils/fileUtils.ts'
import Summary from '@/views/product/series/details/summary.tsx'

function Banner({ productId }: { productId: string | undefined }) {
  const [fileList, setFileList] = useState<any[]>([])
  const [videoFileList, setVideoFileList] = useState<any[]>([])
  const [previewInfo, setPreviewInfo] = useState({
    visible: false,
    url: ''
  })
  const [videoPreviewInfo, setVideoPreviewInfo] = useState({
    visible: false,
    url: ''
  })
  const [loading, setLoading] = React.useState<boolean>(false)

  const getFileList = () => {
    axios.get(`/product-banner/list/${productId}`).then((res: any) => {
      const imageFile: any[] = []
      const videoFile: any[] = []
      res.forEach((d: any) => {
        const item = {
          uid: d.uid,
          name: d.fileName,
          type: d.fileType,
          id: d.id,
          url: d.url,
          status: 'done'
        }
        if (d.type === 'video') {
          videoFile.push(item)
          return
        }

        imageFile.push(item)
      })
      setFileList(imageFile)
      setVideoFileList(videoFile)
    })
  }

  useEffect(() => {
    getFileList()
  }, [])

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) =>
    setFileList(newFileList)

  const handleVideoChange: UploadProps['onChange'] = ({ fileList: newFileList }) =>
    setVideoFileList(newFileList)

  const handlePreview = (file: UploadFile) => {
    if (!file.url) return
    setPreviewInfo({
      visible: true,
      url: file.url
    })
  }

  const handleVideoPreview = (file: UploadFile) => {
    if (!file.url) return
    setVideoPreviewInfo({
      visible: true,
      url: file.url
    })
  }

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传</div>
    </button>
  )

  const handleUpload = async (file: any, url: string, data: any) => {
    const { uid, type, name } = file
    const objectKey = `${uid}.${type.replace(/[\w\W]+\//, '')}`
    await uploadFile(file.originFileObj, objectKey)

    await axios.post(`/product-banner/${url}`, {
      productId,
      fileName: name,
      fileType: type,
      uid,
      objectKey,
      ...data
    })
  }

  const handleImageUpload = async () => {
    const uploadFile = fileList.find((d: any) => d.status !== 'done')
    console.log(uploadFile)
    await handleUpload(uploadFile, 'create', {
      type: 'image'
    })
    getFileList()
  }

  const handleVideoUpload = async () => {
    await handleUpload(videoFileList[0], 'create-video', {
      type: 'video'
    })

    getFileList()
  }

  const handleRemove = async (file: any) => {
    await axios.get(`/product-banner/delete/${file.id}`)
  }

  const sensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 }
  })

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    console.log(active, over)
    if (active.id !== over?.id) {
      setFileList((prev) => {
        const activeIndex = prev.findIndex((i) => i.uid === active.id)
        const overIndex = prev.findIndex((i) => i.uid === over?.id)
        const sortList = arrayMove(prev, activeIndex, overIndex)
        const ids = sortList.map((d: any) => d.id)
        setLoading(true)
        axios
          .post(`/product-banner/batchSort`, {
            ids
          })
          .then(async () => {
            message.success('排序成功')
          })
          .finally(() => {
            setLoading(false)
          })

        return sortList
      })
    }
  }

  interface DraggableUploadListItemProps {
    originNode: React.ReactElement<any, string | React.JSXElementConstructor<any>>
    file: UploadFile<any>
  }

  const DraggableUploadListItem = ({ originNode, file }: DraggableUploadListItemProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: file.uid
    })

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      cursor: 'move',
      height: '100%'
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={isDragging ? 'is-dragging' : ''}
        {...attributes}
        {...listeners}
      >
        {file.status === 'error' && isDragging ? originNode.props.children : originNode}
      </div>
    )
  }

  return (
    <>
      <Row gutter={24}>
        <Col md={12}>
          <Space direction={'vertical'}>
            <h4>图片简介</h4>

            <DndContext sensors={[sensor]} onDragEnd={onDragEnd}>
              <SortableContext
                items={fileList.map((i) => i.uid)}
                strategy={verticalListSortingStrategy}
              >
                <Spin spinning={loading}>
                  <Upload
                    customRequest={handleImageUpload}
                    accept={'.png,.jpg,.jpeg'}
                    listType="picture-card"
                    fileList={fileList}
                    maxCount={10}
                    onPreview={handlePreview}
                    onChange={handleChange}
                    onRemove={handleRemove}
                    itemRender={(originNode, file) => (
                      <DraggableUploadListItem originNode={originNode} file={file} />
                    )}
                  >
                    {fileList.length >= 10 ? null : uploadButton}
                  </Upload>
                </Spin>
              </SortableContext>
            </DndContext>
          </Space>
        </Col>
        <Col md={12}>
          <Space direction={'vertical'}>
            <h4>视频简介</h4>
            <Upload
              customRequest={handleVideoUpload}
              accept={'.mp4'}
              listType="picture-card"
              fileList={videoFileList}
              maxCount={1}
              onChange={handleVideoChange}
              onPreview={handleVideoPreview}
              onRemove={handleRemove}
            >
              {videoFileList.length >= 1 ? null : uploadButton}
            </Upload>
          </Space>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col md={24}>
          <Summary productId={productId} />
        </Col>
      </Row>

      <Image
        width={200}
        style={{ display: 'none' }}
        preview={{
          visible: previewInfo.visible,
          src: previewInfo.url,
          onVisibleChange: (value) => {
            setPreviewInfo({
              visible: value,
              url: ''
            })
          },
          toolbarRender: () => <span></span>
        }}
      />

      <Image
        width={200}
        style={{ display: 'none' }}
        preview={{
          visible: videoPreviewInfo.visible,
          imageRender: () => {
            return (
              <video width="420" height="440" controls>
                <source src={videoPreviewInfo.url} type="video/mp4" />
                您的浏览器不支持 Video 标签。
              </video>
            )
          },
          onVisibleChange: (value) => {
            setVideoPreviewInfo({
              visible: value,
              url: ''
            })
          },
          toolbarRender: () => <span></span>
        }}
      />
    </>
  )
}

export default Banner
