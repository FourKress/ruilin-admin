import React, { FC, useEffect, useState } from 'react'
import { HolderOutlined, PlusOutlined } from '@ant-design/icons'
import { ProForm, ProFormItem, ProList } from '@ant-design/pro-components'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Col, ConfigProvider, Flex, Input, Modal, Row, Space, Tag, theme } from 'antd'

import axios from '@/utils/axios.ts'

import './unit.scss'

const { confirm } = Modal

function Unit({ productId }: { productId: string | undefined }) {
  const [unitList, setUnitList] = useState<any[]>([])
  const [unitLoading, setUnitLoading] = React.useState<boolean>(false)
  const { token } = theme.useToken()

  const handleDeleteUnit = (id: string) => {
    setUnitList(unitList.filter((d: any) => d.id !== id))
  }

  const getUnitList = () => {
    setUnitLoading(true)
    axios.get(`/unit/list/${productId}`).then((res: any) => {
      setUnitList(res)
      setUnitLoading(false)
    })
  }

  useEffect(() => {
    getUnitList()
  }, [])

  type DraggableTagProps = {
    tag: any
    unit: any
  }

  const DraggableTag: FC<DraggableTagProps> = (props) => {
    const { tag, unit } = props
    const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tag.id })

    const commonStyle = {
      cursor: 'move',
      transition: 'unset',
      height: '32px',
      lineHeight: '32px',
      marginBottom: '8px'
    }

    const style = transform
      ? {
          ...commonStyle,
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          transition: isDragging ? 'unset' : transition
        }
      : commonStyle

    return tag.type === 'add' ? (
      <Tag style={tagPlusStyle} icon={<PlusOutlined />}>
        <Input
          className={`add-btn_${unit.id}`}
          size={'small'}
          style={{
            width: '60px'
          }}
          defaultValue={''}
          placeholder="请输入"
          onBlur={(val) => {
            const value = val.target.value
            if (!value) return
            setUnitList(
              unitList.map((d) => {
                const { id, tags } = d
                return {
                  ...d,
                  tags:
                    id === unit.id
                      ? [
                          ...tags,
                          {
                            name: value,
                            id: Date.now()
                          }
                        ]
                      : tags
                }
              })
            )

            setTimeout(() => {
              const input: any = document.querySelector(`.add-btn_${unit.id}`)!
              input.focus()
            }, 100)
          }}
        />
      </Tag>
    ) : (
      <Tag
        style={style}
        key={tag.id}
        closable
        onClose={async (e) => {
          e.preventDefault()
          handleClose(tag.id, unit)
        }}
      >
        <Space>
          <HolderOutlined ref={setNodeRef} {...listeners} />
          {
            <Input
              size={'small'}
              style={{
                width: '60px'
              }}
              defaultValue={tag.name}
              placeholder="请输入"
              onBlur={(val) => {
                console.log(val)
              }}
            />
          }
        </Space>
      </Tag>
    )
  }

  interface DraggableListItemProps {
    item: any
  }

  const DraggableListItem = ({ item }: DraggableListItemProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: item.id
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
        <div className={'unit-card-item'}>
          <Row justify={'space-between'} align={'top'}>
            <Col flex={1} style={{ marginRight: '16px' }}>
              <ProFormItem label={'规格名称'} className={'unit-name'}>
                <Input
                  defaultValue={item.name}
                  placeholder="请输入规格名称"
                  onBlur={(val) => {
                    handleUnitNameChange(val.target.value, item)
                  }}
                />
              </ProFormItem>
            </Col>
            <Col>
              <Button
                type="link"
                style={{ marginLeft: '16px' }}
                onClick={() => {
                  confirm({
                    title: '确认操作',
                    content: '确认删除该规格吗?',
                    onOk: async () => {
                      setUnitList(unitList.filter((d) => d.id !== item.id))
                    }
                  })
                }}
              >
                删除
              </Button>
            </Col>
          </Row>

          <ProFormItem label={'规格属性'}>
            <ConfigProvider theme={{ algorithm: [theme.defaultAlgorithm] }}>
              <Space size={[0, 4]} wrap>
                <DndContext
                  sensors={sensors}
                  onDragEnd={(e) => handleDragEnd(e, item)}
                  collisionDetection={closestCenter}
                >
                  <SortableContext items={item.tags} strategy={horizontalListSortingStrategy}>
                    {[...item.tags, { type: 'add' }].map((tag: any) => {
                      return <DraggableTag tag={tag} key={tag.id} unit={item} />
                    })}
                  </SortableContext>
                </DndContext>
              </Space>
            </ConfigProvider>
          </ProFormItem>
        </div>
      </div>
    )
  }

  const sensors = useSensors(useSensor(PointerSensor))
  const sensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 }
  })

  const handleDragEnd = (event: DragEndEvent, item: any) => {
    const { active, over } = event
    if (!over) return

    if (active.id !== over.id) {
      const tags = item.tags

      const activeIndex = tags.findIndex((d: any) => d.id === active.id)
      const overIndex = tags.findIndex((d: any) => d.id === over.id)
      const sortList = arrayMove(tags, activeIndex, overIndex)

      setUnitList(
        unitList.map((d: any) => {
          return {
            ...d,
            tags: d.id === item.id ? sortList : d.tags
          }
        })
      )
    }
  }

  const onListItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    if (active.id !== over.id) {
      setUnitList((prev) => {
        const activeIndex = prev.findIndex((i) => i.id === active.id)
        const overIndex = prev.findIndex((i) => i.id === over?.id)
        return arrayMove(prev, activeIndex, overIndex)
      })
    }
  }

  const tagPlusStyle: React.CSSProperties = {
    height: 32,
    lineHeight: '32px',
    background: token.colorBgContainer,
    borderStyle: 'dashed',
    marginBottom: '8px'
  }

  const handleUnitNameChange = (val: any, item: any) => {
    setUnitList(
      unitList.map((d) => {
        const { name, id } = d
        return {
          ...d,
          name: id === item.id ? val : name
        }
      })
    )
  }
  const handleClose = (id: string, unit: any) => {
    if (unit.tags.length === 1) {
      confirm({
        title: '确认操作',
        content: '删除最后一个标签将同步删除整个规格，确认删除吗?',
        onOk: () => {
          handleDeleteUnit(unit.id)
        }
      })
      return
    }

    setUnitList(
      unitList.map((d) => {
        return {
          ...d,
          tags: d.id === unit.id ? d.tags.filter((f: any) => f.id !== id) : d.tags
        }
      })
    )
  }

  const handleAddUnit = () => {
    setUnitList([...unitList, { name: '', tags: [], id: Date.now() }])
  }

  return (
    <ProForm
      className={'series-details'}
      layout="horizontal"
      submitter={false}
      onValuesChange={(changeValues) => console.log(changeValues)}
    >
      <Flex justify={'end'} align={'center'}>
        <Button
          key="primary"
          type={'primary'}
          onClick={() => {
            handleAddUnit()
          }}
        >
          <PlusOutlined /> 新建
        </Button>
      </Flex>

      <DndContext sensors={[sensor]} onDragEnd={(e) => onListItemDragEnd(e)}>
        <SortableContext
          items={unitList.map((i: any) => i.id)}
          strategy={horizontalListSortingStrategy}
        >
          <ProList<any>
            className={'unit-card'}
            pagination={false}
            rowSelection={false}
            loading={unitLoading}
            grid={{ gutter: 16, column: 3 }}
            dataSource={unitList}
            renderItem={(item) => {
              return <DraggableListItem item={item} />
            }}
          />
        </SortableContext>
      </DndContext>
    </ProForm>
  )
}

export default Unit
