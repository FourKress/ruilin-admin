import { useEffect, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { PlusOutlined } from '@ant-design/icons'
import {
  EditableFormInstance,
  EditableProTable,
  ProForm,
  ProFormItem,
  ProFormSelect,
  ProFormText
} from '@ant-design/pro-components'
import { Button, Form, Space, Switch } from 'antd'

import './sku.scss'

function Sku({ colorList, unitList }: { colorList: any[]; unitList: any[] }) {
  const { id: productId } = useParams()
  console.log(productId)
  const {
    state: { isEdit }
  } = useLocation()

  const [form] = Form.useForm()
  const [editableKeys, setEditableRowKeys] = useState<any[]>(() => [])
  const [dataSource, setDataSource] = useState<any[]>(() => [])

  const editorFormRef = useRef<EditableFormInstance<any>>()

  console.log(colorList)
  console.log(unitList)

  const handleFormData = () => {
    if (!colorList.length) {
      setDataSource([])
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
              [`unit_${unit.id}`]: tag.name,
              colorName: color.name,
              colorId: color.id,
              stock: '',
              price: '',
              skuCode: '',
              sales: '',
              totalSales: '',
              isActive: false
            }
          })

          if (currentList.length) {
            const tempList = [...currentList]
            currentList = []
            tempList.forEach((t: Record<string, any>) => {
              const unitKeyList = Object.keys(t).filter((key) => key.includes('unit'))!
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

          currentList = currentList.map((d) => {
            return {
              ...d,
              id: `${d.colorId}_${d.id}`
            }
          })
        })
        dataList.push(...currentList)
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
          skuCode: '',
          sales: '',
          totalSales: '',
          isActive: false
        }
      })
    }

    setDataSource(dataList)
    if (isEdit) {
      setEditableRowKeys(dataList.map((d: any) => d.id))
    }
  }

  useEffect(() => {
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
      editable: true
    },
    {
      title: '价格($US)',
      dataIndex: 'price',
      editable: true
    },
    {
      title: 'SKU编码',
      dataIndex: 'skuCode',
      editable: true
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
      valueType: 'option',
      width: 70,
      render: (_text: any, record: any, _: any, _action: any) => [
        <Switch
          disabled={!isEdit}
          key={record.id}
          checkedChildren="已上架"
          unCheckedChildren="已下架"
          defaultChecked={record.isActive}
        />
      ]
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
            dataSource
              .filter((d: any) => {
                let colorFlag = true
                let unitFlag = true
                if (colorId) {
                  colorFlag = d.colorId === colorId
                }
                unitKeys.forEach((key) => {
                  if (!unitFlag) return
                  unitFlag = d[key] && d[key] === other[key]
                })
                return colorFlag && unitFlag
              })
              .forEach((d: any) => {
                editorFormRef.current?.setRowData?.(d.id, {
                  ...d,
                  stock,
                  price
                })
              })
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
                name={`unit_${d.id}`}
                placeholder={`请选择${d.name}`}
                options={d.tags.map((t: any) => {
                  return {
                    label: t.name,
                    value: t.name
                  }
                })}
              ></ProFormSelect>
            )
          })}

          <ProFormText name={'stock'} placeholder="当前库存"></ProFormText>
          <ProFormText name={'price'} placeholder="价格"></ProFormText>
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
        className={'sku-table'}
        editableFormRef={editorFormRef}
        columns={columns}
        rowKey="id"
        value={dataSource}
        onChange={(val) => {
          console.log(val)
          console.log(setDataSource)
        }}
        recordCreatorProps={false}
        editable={{
          editableKeys,
          actionRender: (row) => {
            return [
              <Switch
                key={row.id}
                checkedChildren="已上架"
                unCheckedChildren="已下架"
                defaultChecked={row.isActive}
              />
            ]
          },
          onValuesChange: (_record, recordList) => {
            console.log(recordList)
            setDataSource(recordList)
          },
          onChange: setEditableRowKeys
        }}
      />
    </Space>
  )
}

export default Sku
