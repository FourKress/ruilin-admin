import React, { FC, forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useParams } from 'react-router-dom'
import { HolderOutlined, PlusOutlined } from '@ant-design/icons'
import { DragSortTable, ProColumns } from '@ant-design/pro-components'
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
import { Button, ConfigProvider, Input, message, Modal, Space, Tag, theme } from 'antd'

import axios from '@/utils/axios.ts'

import './unit.scss'

const { confirm } = Modal

const addTagId = Date.now()

interface UnitRef {
  getData: () => any
}

const Unit = forwardRef<UnitRef, { onUpdate: (data: any[]) => void }>(({ onUpdate }, ref) => {
  const { id: productId, edit } = useParams()
  const isEdit = edit === '1'

  const [unitList, setUnitList] = useState<any[]>([])
  const [unitRemoveList, setUnitRemoveList] = useState<any[]>([])
  const [tagRemoveList, setTagRemoveList] = useState<any[]>([])
  const [unitLoading, setUnitLoading] = React.useState<boolean>(false)
  const { token } = theme.useToken()

  const handleDeleteUnit = (unit: Record<string, any>) => {
    setUnitList(unitList.filter((d: any) => d.id !== unit.id))
    if (productId && unit.createTime) {
      setUnitRemoveList([...unitRemoveList, unit.id])
    }
  }

  const getUnitList = () => {
    if (!productId) return
    setUnitLoading(true)
    axios
      .get(`/product-unit/${isEdit ? 'list' : 'online-list'}/${productId}`)
      .then((res: any) => {
        setUnitList(res)
      })
      .finally(() => {
        setUnitLoading(false)
      })
  }

  useEffect(() => {
    getUnitList()
  }, [])

  useEffect(() => {
    if (!unitList.length) {
      onUpdate([])
    }
    const list = unitList.filter((d: any) => d.name && d.tags?.length)
    const length = list.length
    if (!length) return
    onUpdate(list)
  }, [unitList])

  useImperativeHandle(ref, () => ({
    getData: (): any => {
      return {
        removeIds: unitRemoveList,
        tagRemoveIds: tagRemoveList,
        editList: unitList.filter((d: any) => d.name)
      }
    }
  }))

  type DraggableTagProps = {
    tag: Record<string, any>
    unit: any
  }

  const DraggableTag: FC<DraggableTagProps> = (props) => {
    const { tag, unit } = props
    const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tag.id })

    const commonStyle = {
      cursor: isEdit ? 'move' : 'default',
      transition: 'unset',
      height: '32px',
      lineHeight: '32px'
    }

    const style = transform
      ? {
          ...commonStyle,
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          transition: isDragging ? 'unset' : transition
        }
      : commonStyle

    return tag.type === 'add' && isEdit ? (
      <Tag style={tagPlusStyle} icon={<PlusOutlined />}>
        <Input
          className={`add-btn_${unit.id}`}
          size={'small'}
          style={{
            width: '60px'
          }}
          defaultValue={''}
          placeholder="请输入"
          onBlur={async (e) => {
            const value = e.target.value
            if (!value) return

            const tags = unit.tags
            if (value && tags.some((d: any) => d.id !== tag.id && d.name === value)) {
              message.error('规格属性重复，请重新输入')
              const list = tags.map((d: any) => {
                return {
                  ...d,
                  name: tag.id === d.id ? '' : d.name
                }
              })

              setUnitList(
                unitList.map((d) => {
                  const { id, tags } = d
                  return {
                    ...d,
                    tags: id === unit.id ? list : tags
                  }
                })
              )
            } else {
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
            }

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
          handleClose(tag, unit)
        }}
      >
        <Space>
          {isEdit && <HolderOutlined ref={setNodeRef} {...listeners} />}
          {
            <Input
              size={'small'}
              style={{
                width: '60px'
              }}
              readOnly={!isEdit}
              defaultValue={tag.name}
              placeholder="请输入"
              onBlur={async (e) => {
                const value = e.target.value
                let list: any[] = []
                const tags = unit.tags

                if (value) {
                  if (tags.some((d: any) => d.id !== tag.id && d.name === value)) {
                    message.error('规格属性重复，请重新输入')
                    list = tags
                  } else {
                    list = tags.map((d: any) => {
                      const { name, id } = d
                      return {
                        ...d,
                        name: id === tag.id ? value : name
                      }
                    })
                  }
                } else {
                  list = tags.filter((d: any) => d.id !== tag.id)
                }

                setUnitList(
                  unitList.map((d) => {
                    const { id, tags } = d
                    return {
                      ...d,
                      tags: id === unit.id ? list : tags
                    }
                  })
                )
              }}
            />
          }
        </Space>
      </Tag>
    )
  }

  const sensors = useSensors(useSensor(PointerSensor))

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

  const tagPlusStyle: React.CSSProperties = {
    height: 32,
    lineHeight: '32px',
    background: token.colorBgContainer,
    borderStyle: 'dashed'
  }

  const handleUnitNameChange = async (val: any, item: any) => {
    if (val && unitList.some((d: any) => d.id !== item.id && d.name === val)) {
      message.error('规格名称重复，请重新输入')
      setUnitList([...unitList])
    } else {
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
  }
  const handleClose = (tag: Record<string, any>, unit: Record<string, any>) => {
    if (unit.tags.length === 1) {
      confirm({
        title: '确认操作',
        content: '删除最后一个标签将同步删除整个规格，确认删除吗?',
        onOk: () => {
          if (productId && tag.createTime) {
            setTagRemoveList([...tagRemoveList, tag.id])
          }
          handleDeleteUnit(unit)
        }
      })
      return
    }

    if (productId && tag.createTime) {
      setTagRemoveList([...tagRemoveList, tag.id])
    }

    setUnitList(
      unitList.map((d) => {
        return {
          ...d,
          tags: d.id === unit.id ? d.tags.filter((f: any) => f.id !== tag.id) : d.tags
        }
      })
    )
  }

  const handleAddUnit = () => {
    setUnitList([...unitList, { name: '', tags: [], id: Date.now() }])
  }

  const handleDragSortEnd = async (
    _beforeIndex: number,
    _afterIndex: number,
    newDataSource: any
  ) => {
    setUnitList(newDataSource)
  }

  const columns: ProColumns[] = [
    {
      title: '规格名称',
      dataIndex: 'name',
      width: 120,
      render: (_, record) => {
        return (
          <Input
            readOnly={!isEdit}
            defaultValue={record.name}
            placeholder="请输入规格名称"
            onBlur={async (e) => {
              await handleUnitNameChange(e.target.value, record)
            }}
          />
        )
      }
    },
    {
      title: '规格属性',
      dataIndex: 'smallFileList',
      ellipsis: true,
      render: (_, record) => {
        return (
          <ConfigProvider theme={{ algorithm: [theme.defaultAlgorithm] }}>
            <Space size={[0, 4]} wrap>
              <DndContext
                sensors={sensors}
                onDragEnd={(e) => handleDragEnd(e, record)}
                collisionDetection={closestCenter}
              >
                <SortableContext
                  items={record.tags.map((i: any) => i.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {[...record.tags, { type: 'add', id: addTagId }].map((tag: any) => {
                    return <DraggableTag tag={tag} key={tag.id} unit={record} />
                  })}
                </SortableContext>
              </DndContext>
            </Space>
          </ConfigProvider>
        )
      }
    }
  ]

  if (isEdit) {
    columns.unshift({
      title: '排序',
      dataIndex: 'sort',
      width: 40,
      className: 'drag-visible'
    })
    columns.push({
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      ellipsis: false,
      width: 40,
      render: (_, record: Record<string, any>) => {
        return [
          <a
            key="delete"
            onClick={() => {
              confirm({
                title: '确认操作',
                content: '确认删除该规格吗?',
                onOk() {
                  if (productId && record.tags) {
                    const ids = record.tags
                      .filter((d: Record<string, any>) => productId && d.createTime)
                      .map((d: any) => d.id)

                    setTagRemoveList([...tagRemoveList, ...ids])
                  }
                  handleDeleteUnit(record)
                }
              })
            }}
          >
            删除
          </a>
        ]
      }
    })
  }

  return (
    <>
      <DragSortTable
        className={'unit-card'}
        style={{ marginTop: '-12px' }}
        dragSortKey="sort"
        onDragSortEnd={handleDragSortEnd}
        loading={unitLoading}
        dataSource={unitList}
        size={'small'}
        options={{
          reload: false,
          setting: false,
          density: false
        }}
        search={false}
        rowKey="id"
        headerTitle=""
        columns={columns}
        pagination={false}
        toolBarRender={() => [
          isEdit && (
            <Button
              type="primary"
              key="primary"
              onClick={() => {
                handleAddUnit()
              }}
            >
              <PlusOutlined /> 新建
            </Button>
          )
        ]}
      />
    </>
  )
})

export default Unit
