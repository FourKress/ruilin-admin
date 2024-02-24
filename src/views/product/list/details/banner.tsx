import React, { useEffect, useState } from 'react'
import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { DndContext, DragEndEvent, PointerSensor, useSensor } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Col, Descriptions, Image, Row, Space, Spin, Upload, UploadFile, UploadProps } from 'antd'

import axios from '@/utils/axios.ts'
import Summary from '@/views/product/list/details/summary.tsx'

const descList = [
  {
    key: '1',
    label: '1.素材限制',
    span: 3,
    children: <p>图片视频宽高比例为4:3。图片宽高均大于1200px，大小10M以内；视频时长5s-60s以内</p>
  },
  {
    key: '2',
    label: '2.数量限制',
    span: 3,
    children: <p>数量限制：图片最少上传1张，最多可上传9张；视频最多可上传1个。</p>
  },
  {
    key: '3',
    label: '3.排序限制',
    span: 3,
    children: <p>排序影响商城展示顺序。图片视频排序可直接手动拖拽排序</p>
  }
]

function Banner({ productId }: { productId: string | undefined }) {
  const [fileList, setFileList] = useState<any[]>([])
  const [videoFileList, setVideoFileList] = useState<any[]>([])
  const [previewInfo, setPreviewInfo] = useState({
    visible: false,
    url: ''
  })

  const [loading, setLoading] = React.useState<boolean>(false)

  const getFileList = () => {
    setLoading(true)
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
      setLoading(false)
    })
  }

  useEffect(() => {
    getFileList()
  }, [])

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList)
  }

  const handleVideoChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setVideoFileList(newFileList)
  }

  const handlePreview = (file: UploadFile) => {
    const url = file.url || file.thumbUrl
    if (!url) return
    setPreviewInfo({
      visible: true,
      url
    })
  }

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传</div>
    </button>
  )

  const sensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 }
  })

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setFileList((prev) => {
        const activeIndex = prev.findIndex((i) => i.uid === active.id)
        const overIndex = prev.findIndex((i) => i.uid === over?.id)
        return arrayMove(prev, activeIndex, overIndex)
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
    <Space direction={'vertical'}>
      <Descriptions
        items={descList}
        size={'small'}
        contentStyle={{ color: 'rgba(0, 0, 0, 0.45)' }}
      />

      <Row gutter={24}>
        <Col>
          <Space direction={'vertical'}>
            <h4>介绍视频</h4>
            <Spin spinning={loading}>
              <Upload
                accept={'.mp4'}
                listType="picture-card"
                fileList={videoFileList}
                maxCount={1}
                onChange={handleVideoChange}
                beforeUpload={(file: any) => {
                  file.url = URL.createObjectURL(file)
                  return false
                }}
                itemRender={(originNode, file) => {
                  return (
                    <div className={originNode.props.className}>
                      {originNode.props.children[0]}
                      {originNode.props.children[1]}
                      <div className={originNode.props.children[2].props.className}>
                        <EyeOutlined
                          onClick={() => {
                            handlePreview(file)
                          }}
                        />
                        {originNode.props.children[2].props.children[2]}
                      </div>
                    </div>
                  )
                }}
              >
                {videoFileList.length >= 1 ? null : uploadButton}
              </Upload>
            </Spin>
          </Space>
        </Col>
        <Col flex={1}>
          <Space direction={'vertical'}>
            <h4>轮播图</h4>

            <DndContext sensors={[sensor]} onDragEnd={onDragEnd}>
              <SortableContext
                items={fileList.map((i) => i.uid)}
                strategy={verticalListSortingStrategy}
              >
                <Spin spinning={loading}>
                  <Upload
                    accept={'.png,.jpg,.jpeg'}
                    listType="picture-card"
                    fileList={fileList}
                    maxCount={9}
                    onPreview={handlePreview}
                    onChange={handleChange}
                    beforeUpload={() => false}
                    itemRender={(originNode, file) => (
                      <DraggableUploadListItem originNode={originNode} file={file} />
                    )}
                  >
                    {fileList.length >= 9 ? null : uploadButton}
                  </Upload>
                </Spin>
              </SortableContext>
            </DndContext>
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
          onVisibleChange: (value) => {
            setPreviewInfo({
              visible: value,
              url: ''
            })
          },
          toolbarRender: () => <span></span>,
          ...(previewInfo.url.includes('blob')
            ? {
                imageRender: () => {
                  return (
                    <video width="420" height="440" controls>
                      <source src={previewInfo.url} type="video/mp4" />
                      您的浏览器不支持 Video 标签。
                    </video>
                  )
                }
              }
            : {
                src: previewInfo.url
              })
        }}
      />
    </Space>
  )
}

export default Banner
