import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PlusOutlined } from '@ant-design/icons'
import {
  EditableFormInstance,
  EditableProTable,
  ProForm,
  ProFormDigit,
  ProFormItem,
  ProFormSelect
} from '@ant-design/pro-components'
import { Button, Form, Input, InputNumber, Space, Switch } from 'antd'

import axios from '@/utils/axios.ts'

import './sku.scss'

interface SkuRef {
  getData: () => any
}

const Sku = forwardRef<SkuRef, { colorList: any[]; unitList: any[] }>(
  ({ colorList, unitList }, ref) => {
    const { id: productId, edit } = useParams()
    const isEdit = edit === '1'

    const [form] = Form.useForm()
    const [editForm] = Form.useForm()
    const [editableKeys, setEditableRowKeys] = useState<any[]>(() => [])
    const [dataSource, setDataSource] = useState<any[]>(() => [])
    const [backupDataSource, setBackupDataSource] = useState<any[]>(() => [])
    const [skuLoading, setSkuLoading] = React.useState<boolean>(false)
    const [skuList, setSkuList] = React.useState<any[]>([])

    const editorFormRef = useRef<EditableFormInstance<any>>()

    const getSkuList = () => {
      if (!productId) return
      setSkuLoading(true)
      axios
        .get(`/product-sku/${isEdit ? 'list' : 'online-list'}/${productId}`)
        .then((res: any) => {
          setSkuList(res)
        })
        .finally(() => {
          setSkuLoading(false)
        })
    }

    useEffect(() => {
      getSkuList()
    }, [])

    useImperativeHandle(ref, () => ({
      getData: (): any => {
        return {
          editList: dataSource.map((d) => {
            const { stock, price, isActive } = d
            return {
              ...d,
              isActive: !stock || !price ? false : isActive
            }
          })
        }
      }
    }))

    const handleFormData = () => {
      if (!colorList.length) {
        return
      }

      let dataList: any[] = []
      if (unitList.length) {
        colorList.forEach((color: any) => {
          let currentList: any[] = []
          unitList.forEach((unit: any) => {
            const { tags } = unit

            const newTags = tags.map((tag: any) => {
              return {
                id: `${unit.id}-${tag.id}`,
                [`unit_${unit.id}`]: {
                  name: tag.name,
                  value: tag.id
                },
                colorName: color.name,
                colorId: color.id,
                stock: 0,
                price: 0.0,
                code: '',
                isActive: false
              }
            })

            if (currentList.length) {
              const tempList = [...currentList]
              currentList = []
              tempList.forEach((t: Record<string, any>) => {
                const unitKeyList = Object.keys(t).filter((key) => key.includes('unit_'))!
                newTags.forEach((n: any) => {
                  currentList.push({
                    ...n,
                    id: `${n.id}&${t.id}`,
                    ...Object.fromEntries(
                      unitKeyList.map((k) => {
                        return [k, t[k]]
                      })
                    )
                  })
                })
              })
            } else {
              currentList.push(...newTags)
            }
          })
          dataList.push(
            ...currentList.map((d) => {
              return {
                ...d,
                id: `${d.colorId}_${d.id}`
              }
            })
          )
        })
      } else {
        dataList = colorList.map((d: any) => {
          const { name, id } = d
          return {
            id,
            colorName: name,
            colorId: id,
            stock: 0,
            price: 0.0,
            code: '',
            isActive: false
          }
        })
      }
      if (skuList?.length || backupDataSource.length) {
        const historyList = backupDataSource?.length ? backupDataSource : skuList
        dataList = [
          ...dataList.map((d: any) => {
            const { colorId } = d
            const unitKeyList = Object.keys(d).filter((key) => key.includes('unit_'))!
            const unitIds = JSON.stringify(unitKeyList.map((k) => k.replace(/unit_/, '')).sort())
            const tagIds = JSON.stringify(unitKeyList.map((k: any) => d[k]?.value).sort())
            const target = historyList.find((s: Record<string, any>) => {
              if (s.createTime) {
                return (
                  s.colorId === colorId &&
                  JSON.stringify(s.unitIds.sort()) === unitIds &&
                  JSON.stringify(s.tagIds.sort()) === tagIds
                )
              } else {
                const backupUnitKeyList = Object.keys(s).filter((key) => key.includes('unit_'))!
                const backupUnitIds = JSON.stringify(
                  backupUnitKeyList.map((k) => k.replace(/unit_/, '')).sort()
                )
                const backupTagIds = JSON.stringify(
                  backupUnitKeyList.map((k: any) => s[k]?.value).sort()
                )
                return s.colorId === colorId && backupUnitIds === unitIds && backupTagIds === tagIds
              }
            })
            return {
              ...d,
              ...target
            }
          })
        ]
      }
      setDataSource(dataList)
      if (isEdit) {
        setEditableRowKeys(dataList.map((d: any) => d.id))
      }
    }

    useEffect(() => {
      setDataSource([])
      editForm.resetFields()
      handleFormData()
    }, [unitList, colorList, skuList])

    const columns: any[] = [
      {
        title: '颜色',
        dataIndex: 'colorName',
        editable: false,
        onCell: (row: any, index: number) => {
          let rowSpan = 1
          if (index > 0 && dataSource[index - 1].colorName === row.colorName) {
            rowSpan = 0
          } else {
            rowSpan = dataSource.filter((item: any) => item.colorName === row.colorName).length
          }
          return {
            rowSpan: rowSpan
          }
        }
      },
      ...(unitList.length
        ? unitList.map((d: any, sort) => {
            const key = `unit_${d.id}`
            return {
              title: d.name,
              dataIndex: key,
              editable: false,
              render: (_: any, record: any, _form: any) => {
                return <span>{record[key]?.name}</span>
              },
              onCell: (_row: any, index: number) => {
                let rowSpan = 1
                if (sort === unitList.length - 1) {
                  return {
                    rowSpan: rowSpan
                  }
                }

                const step = [...unitList]
                  .splice(sort + 1, unitList.length - 1)
                  .map((d) => d.tags.length)
                  .reduce((pre, cur) => pre * cur, 1)

                if (index % step === 0) {
                  rowSpan = step
                } else {
                  rowSpan = 0
                }

                return {
                  rowSpan: rowSpan
                }
              }
            }
          })
        : []),
      {
        title: '库存',
        dataIndex: 'stock',
        editable: true,
        renderFormItem: (_: any, { record }: { record: any }, _form: any) => {
          return (
            <InputNumber
              placeholder={'请输入'}
              precision={0}
              min={0}
              key={record.id}
              value={record.stock}
            />
          )
        }
      },
      {
        title: '价格($US)',
        dataIndex: 'price',
        editable: true,
        renderFormItem: (_: any, { record }: { record: any }, _form: any) => {
          return (
            <InputNumber
              placeholder={'请输入'}
              precision={2}
              min={0}
              key={record.id}
              value={record.price}
            />
          )
        }
      },
      {
        title: 'SKU编码(选填)',
        dataIndex: 'code',
        editable: true,
        renderFormItem: (_: any, { record }: { record: any }, _form: any) => {
          return <Input placeholder={'请输入'} key={record.id} value={record.code} />
        }
      },
      {
        title: '状态',
        dataIndex: 'isActive',
        width: 70,
        ...(isEdit
          ? {
              renderFormItem: (_: any, { record }: { record: any }, _form: any) => {
                const { isActive, price, stock } = record
                return (
                  <Switch
                    disabled={!isEdit || !(price && stock)}
                    key={record.id}
                    checkedChildren="上架"
                    unCheckedChildren="下架"
                    value={isActive}
                  />
                )
              }
            }
          : {
              render: (_text: any, record: any, _: any, _action: any) => {
                return (
                  <Switch
                    defaultValue={record.isActive}
                    disabled={true}
                    checkedChildren="已上架"
                    unCheckedChildren="未上架"
                  />
                )
              }
            })
      }
    ]

    return (
      <Space size={'middle'} direction={'vertical'} style={{ width: '100%' }}>
        {isEdit && (
          <ProForm
            form={form}
            className={'sku-details'}
            layout="inline"
            submitter={false}
            initialValues={{ isActive: undefined, stock: undefined, price: undefined }}
            onFinish={async (val) => {
              const { colorIds, price, stock, isActive, ...other } = val
              const unitKeys = Object.keys(other)
              const editList = dataSource
                .filter((d: any) => {
                  let colorFlag = true
                  let unitFlag = true
                  if (colorIds) {
                    colorFlag = colorIds.includes(d.colorId)
                  }
                  unitKeys.forEach((key) => {
                    if (!unitFlag) return
                    unitFlag = d[key] && other[key].includes(d[key].value)
                  })
                  return colorFlag && unitFlag
                })
                .map((d: any) => {
                  const data = {
                    ...d,
                    stock,
                    price,
                    isActive:
                      !stock || !price ? false : isActive === undefined ? d.isActive : isActive
                  }
                  if (editorFormRef.current?.setRowData) {
                    editorFormRef.current?.setRowData(d.id, {
                      ...data
                    })
                  }

                  return { ...data }
                })

              const newData = dataSource.map((d: any) => {
                const target = editList.find((f: any) => f.id === d.id)
                if (target) {
                  return {
                    ...target
                  }
                }
                return {
                  ...d
                }
              })
              setDataSource(newData)
              setBackupDataSource([...newData])
            }}
          >
            <ProFormSelect
              label={'批量设置'}
              name={'colorIds'}
              mode={'multiple'}
              placeholder="请选择颜色"
              options={colorList.map((d) => {
                return {
                  label: d.name,
                  value: d.id
                }
              })}
            ></ProFormSelect>
            {unitList.map((d: any) => {
              return (
                <ProFormSelect
                  key={`unit_${d.id}`}
                  name={`unit_${d.id}`}
                  placeholder={`请选择${d.name}`}
                  mode={'multiple'}
                  options={d.tags.map((t: any) => {
                    return {
                      label: t.name,
                      value: t.id
                    }
                  })}
                ></ProFormSelect>
              )
            })}

            <ProFormDigit
              name={'stock'}
              placeholder="当前库存"
              fieldProps={{
                precision: 0,
                min: 0
              }}
            ></ProFormDigit>
            <ProFormDigit
              name={'price'}
              placeholder="价格"
              fieldProps={{
                precision: 2,
                min: 0
              }}
            ></ProFormDigit>
            <ProFormSelect
              name={'isActive'}
              placeholder="上架/下架状态"
              options={[
                {
                  label: '上架',
                  value: true
                },
                {
                  label: '下架',
                  value: false
                }
              ]}
            ></ProFormSelect>
            <ProFormItem>
              <Button
                key="primary"
                type={'primary'}
                onClick={() => {
                  form?.submit?.()
                }}
              >
                <PlusOutlined /> 批量设置
              </Button>
            </ProFormItem>
          </ProForm>
        )}

        <EditableProTable
          loading={skuLoading}
          className={'sku-table'}
          editableFormRef={editorFormRef}
          columns={columns}
          rowKey="id"
          value={dataSource}
          recordCreatorProps={false}
          editable={{
            form: editForm,
            type: 'multiple',
            editableKeys,
            actionRender: () => {
              return []
            },
            onValuesChange: (record, recordList) => {
              const { stock, price, id } = record
              const newData = recordList.map((d: any) => {
                const { stock, price, isActive } = d
                return {
                  ...d,
                  isActive: !stock || !price ? false : isActive
                }
              })
              setDataSource(newData)
              setBackupDataSource([...newData])

              if (!stock || !price) {
                if (editorFormRef.current?.setRowData) {
                  editorFormRef.current?.setRowData(id, {
                    ...record,
                    isActive: false
                  })
                }
              }
            }
          }}
        />
      </Space>
    )
  }
)

export default Sku
