import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { EyeOutlined, PlayCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { DndContext, DragEndEvent, PointerSensor, useSensor } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Col,
  Descriptions,
  Empty,
  Image,
  Row,
  Space,
  Spin,
  Upload,
  UploadFile,
  UploadProps
} from 'antd'

import axios from '@/utils/axios.ts'
import { checkFileSize } from '@/utils/fileUtils.ts'
import Summary from '@/views/product/list/details/summary.tsx'

import './banner.scss'

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

interface DetailsRef {
  getBannerData: () => any
  getSummaryData: () => any
}

const Banner = forwardRef<DetailsRef>((_props, ref) => {
  const { id: productId, edit } = useParams()
  const isEdit = edit === '1'

  const [imageFileList, setImageFileList] = useState<any[]>([])
  const [videoFileList, setVideoFileList] = useState<any[]>([])
  const [imageRemoveList, setImageRemoveList] = useState<any[]>([])
  const [videoRemoveList, setVideoRemoveList] = useState<any[]>([])
  const [previewInfo, setPreviewInfo] = useState({
    visible: false,
    url: '',
    type: ''
  })

  const videoRef = useRef<any>()
  const [loading, setLoading] = React.useState<boolean>(false)
  const summaryRef = useRef<any>()

  const getFileList = () => {
    if (!productId) return
    setLoading(true)
    axios
      .get(`/product-banner/${isEdit ? 'list' : 'online-list'}/${productId}`)
      .then((res: any) => {
        const imageList: any[] = []
        const videoList: any[] = []
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
            videoList.push(item)
            return
          }

          imageList.push(item)
        })
        setImageFileList(imageList)
        setVideoFileList(videoList)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    getFileList()
  }, [])

  useImperativeHandle(ref, () => ({
    getBannerData: (): any => {
      return {
        image: { upload: imageFileList.filter((d: any) => !d.status), removeIds: imageRemoveList },
        video: { upload: videoFileList.filter((d: any) => !d.status), removeIds: videoRemoveList }
      }
    },
    getSummaryData: () => {
      return summaryRef.current?.getData()
    }
  }))

  const handleChange: UploadProps['onChange'] = ({ file, fileList }) => {
    const length = fileList.length
    if (length && length > imageFileList.length && !checkFileSize(file)) {
      return
    }
    setImageFileList(fileList)
  }

  const handleVideoChange: UploadProps['onChange'] = ({ file, fileList }) => {
    if (fileList.length && !checkFileSize(file)) {
      return
    }
    setVideoFileList(fileList)
  }

  const handlePreview = (file: UploadFile) => {
    const url = file.url || file.thumbUrl
    if (!url) return
    setPreviewInfo({
      visible: true,
      url,
      type: file.type || ''
    })
  }

  const uploadButton = isEdit && (
    <button style={{ border: 0, background: 'none' }} type="button">
      <PlusOutlined />
      <div>上传</div>
    </button>
  )

  const sensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 }
  })

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setImageFileList((prev) => {
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
      cursor: isEdit ? 'move' : 'default',
      height: '100%'
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={isDragging ? 'is-dragging' : ''}
        {...(isEdit ? attributes : {})}
        {...(isEdit ? listeners : {})}
      >
        <div className={originNode.props.className}>
          {originNode.props.children[0]}
          <div className={originNode.props.children[2].props.className}>
            <EyeOutlined
              onClick={() => {
                handlePreview(file)
              }}
            />
            {isEdit && originNode.props.children[2].props.children[2]}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Space direction={'vertical'} className={'banner-card'}>
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
              {videoFileList.length || isEdit ? (
                <Upload
                  className={'banner-upload'}
                  accept={'.mp4'}
                  listType="picture-card"
                  fileList={videoFileList}
                  maxCount={1}
                  onChange={handleVideoChange}
                  onRemove={(file: any) => {
                    if (productId && file.id) {
                      setVideoRemoveList([...videoRemoveList, file.id])
                    }
                  }}
                  beforeUpload={(file: any) => {
                    file.url = URL.createObjectURL(file)
                    return false
                  }}
                  itemRender={(originNode, file) => {
                    return (
                      <div className={originNode.props.className}>
                        <div
                          className={originNode.props.children[0].props.className}
                          style={{ marginTop: '6px' }}
                        >
                          <PlayCircleOutlined />
                        </div>
                        <div className={originNode.props.children[2].props.className}>
                          <EyeOutlined
                            onClick={() => {
                              handlePreview(file)
                            }}
                          />
                          {isEdit && originNode.props.children[2].props.children[2]}
                        </div>
                      </div>
                    )
                  }}
                >
                  {videoFileList.length >= 1 ? null : uploadButton}
                </Upload>
              ) : (
                <Empty className={'banner-empty'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Spin>
          </Space>
        </Col>
        <Col flex={1}>
          <Space direction={'vertical'}>
            <h4>轮播图</h4>
            {imageFileList.length || isEdit ? (
              <DndContext sensors={[sensor]} onDragEnd={onDragEnd}>
                <SortableContext
                  items={imageFileList.map((i) => i.uid)}
                  strategy={verticalListSortingStrategy}
                >
                  <Spin spinning={loading}>
                    <Upload
                      className={'banner-upload'}
                      accept={'.png,.jpg,.jpeg'}
                      listType="picture-card"
                      fileList={imageFileList}
                      maxCount={9}
                      onChange={handleChange}
                      onRemove={(file: any) => {
                        if (productId && file.id) {
                          setImageRemoveList([...imageRemoveList, file.id])
                        }
                      }}
                      beforeUpload={() => false}
                      itemRender={(originNode, file) => (
                        <DraggableUploadListItem originNode={originNode} file={file} />
                      )}
                    >
                      {imageFileList.length >= 9 ? null : uploadButton}
                    </Upload>
                  </Spin>
                </SortableContext>
              </DndContext>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Space>
        </Col>
      </Row>
      <Row gutter={24}>
        <Col md={24}>
          <Summary ref={summaryRef} />
        </Col>
      </Row>
      <Image
        width={200}
        style={{ display: 'none' }}
        preview={{
          visible: previewInfo.visible,
          onVisibleChange: (value) => {
            videoRef?.current?.pause()
            setPreviewInfo({
              visible: value,
              url: '',
              type: ''
            })
          },
          toolbarRender: () => <span></span>,
          ...(previewInfo.url.includes('blob') || previewInfo.type.includes('video')
            ? {
                imageRender: () => {
                  return (
                    previewInfo.visible && (
                      <video ref={videoRef} width="420" height="440" controls>
                        <source src={previewInfo.url} type="video/mp4" />
                        您的浏览器不支持 Video 标签。
                      </video>
                    )
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
})

export default Banner
