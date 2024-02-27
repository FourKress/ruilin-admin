import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
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
    const { id: productId } = useParams()
    console.log(productId)
    const {
      state: { isEdit }
    } = useLocation()

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
        .get(`/product-sku/list/${productId}`)
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
            const { stock, price, code, isActive } = d
            return {
              ...d,
              isActive: !stock || !price || code === '' ? false : isActive
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
                stock: '',
                price: '',
                code: '',
                sales: '',
                totalSales: '',
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
            stock: '',
            price: '',
            code: '',
            sales: '',
            totalSales: '',
            isActive: false
          }
        })
      }
      if (skuList?.length || backupDataSource.length) {
        const historyList = backupDataSource || skuList
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
                const HunitKeyList = Object.keys(s).filter((key) => key.includes('unit_'))!
                const HunitIds = JSON.stringify(
                  HunitKeyList.map((k) => k.replace(/unit_/, '')).sort()
                )
                const HtagIds = JSON.stringify(HunitKeyList.map((k: any) => s[k]?.value).sort())
                return s.colorId === colorId && HunitIds === unitIds && HtagIds === tagIds
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
    }, [unitList, colorList])

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
        title: 'SKU编码',
        dataIndex: 'code',
        editable: true,
        renderFormItem: (_: any, { record }: { record: any }, _form: any) => {
          return <Input placeholder={'请输入'} key={record.id} value={record.code} />
        }
      },
      {
        title: '30天销量',
        dataIndex: 'sales',
        editable: false
      },
      {
        title: '累计销量',
        dataIndex: 'totalSales',
        editable: false
      },
      {
        title: '状态',
        dataIndex: 'isActive',
        width: 70,
        renderFormItem: (_: any, { record }: { record: any }, _form: any) => {
          const { isActive, code, price, stock } = record
          return (
            <Switch
              disabled={!isEdit || !(code && price && stock)}
              key={record.id}
              checkedChildren="上架"
              unCheckedChildren="上架"
              value={isActive}
            />
          )
        }
      }
    ]

    return (
      <Space size={'middle'} direction={'vertical'} style={{ width: '100%' }}>
        {isEdit && (
          <ProForm
            form={form}
            className={'series-details'}
            layout="inline"
            submitter={false}
            onFinish={async (val) => {
              const { colorId, price, stock, ...other } = val
              const unitKeys = Object.keys(other)
              const editList = dataSource
                .filter((d: any) => {
                  let colorFlag = true
                  let unitFlag = true
                  if (colorId) {
                    colorFlag = d.colorId === colorId
                  }
                  unitKeys.forEach((key) => {
                    if (!unitFlag) return
                    unitFlag = d[key] && d[key].value === other[key]
                  })
                  return colorFlag && unitFlag
                })
                .map((d: any) => {
                  const { code, isActive } = d
                  const data = {
                    ...d,
                    stock,
                    price,
                    isActive: !stock || !price || code === '' ? false : isActive
                  }
                  editorFormRef.current?.setRowData?.(d.id, {
                    ...data
                  })

                  return { ...data }
                })

              setBackupDataSource([
                ...editList.map((d: any) => {
                  const { stock, price, code, isActive } = d
                  return {
                    ...d,
                    isActive: !stock || !price || code === '' ? false : isActive
                  }
                })
              ])
            }}
          >
            <ProFormSelect
              label={'批量设置'}
              name={'colorId'}
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
          controlled
          editable={{
            form: editForm,
            type: 'multiple',
            editableKeys,
            actionRender: () => {
              return []
            },
            onValuesChange: (record, recordList) => {
              const { stock, price, code, id } = record
              setDataSource(recordList)
              setBackupDataSource([
                ...recordList.map((d: any) => {
                  const { stock, price, code, isActive } = d
                  return {
                    ...d,
                    isActive: !stock || !price || code === '' ? false : isActive
                  }
                })
              ])

              if (!stock || !price || code === '') {
                editorFormRef.current?.setRowData?.(id, {
                  ...record,
                  isActive: false
                })
              }
            }
          }}
        />
      </Space>
    )
  }
)

export default Sku
