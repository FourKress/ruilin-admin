import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import {
  EditableProTable,
  ProForm,
  ProFormItem,
  ProFormSelect,
  ProFormText
} from '@ant-design/pro-components'
import { Button, Form, Space, Switch } from 'antd'

import './sku.scss'

const defaultData = [
  {
    id: '6247481504',
    colorName: '活动名称一',
    stock: '123',
    price: '这个活动真好玩',
    state: 'open',
    skuCode: '1590486176000',
    sales: '1590481162000',
    totalSales: '1590481162000',
    isActive: true
  },
  {
    id: '6246912229',
    colorName: '活动名称一',
    stock: 'e2',
    price: '这个活动真好玩',
    state: 'closed',
    skuCode: '1590486176000',
    sales: '1590481162000',
    totalSales: '1590481162000',
    isActive: true
  },
  {
    id: '624691334229',
    colorName: '活动名称一',
    stock: 'e2',
    price: '这个活动真好玩',
    state: 'closed',
    skuCode: '1590486176000',
    sales: '1590481162000',
    totalSales: '1590481162000',
    isActive: true
  },
  {
    id: '62469142229',
    colorName: '活动名称12一',
    stock: 'e2',
    price: '这个活动真好玩',
    state: 'closed',
    skuCode: '1590486176000',
    sales: '1590481162000',
    totalSales: '1590481162000',
    isActive: false
  }
]

function Sku({ productId }: { productId: string | undefined }) {
  console.log(productId)
  const [form] = Form.useForm()

  const [editableKeys, setEditableRowKeys] = useState<any[]>(() =>
    defaultData.map((item) => item.id)
  )
  const [dataSource, setDataSource] = useState<any[]>(() => defaultData)

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
    {
      title: '长度',
      dataIndex: 'state',
      editable: false
    },
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
      width: 70
    }
  ]

  return (
    <Space size={'middle'} direction={'vertical'} style={{ width: '100%' }}>
      <ProForm
        form={form}
        className={'series-details'}
        layout="inline"
        submitter={false}
        initialValues={{ price: '1', stock: '123123' }}
        onFinish={async (val) => {
          console.log(val)
        }}
        onValuesChange={(changeValues) => console.log(changeValues)}
      >
        <ProFormSelect
          label={'批量设置'}
          name={'color'}
          placeholder="请选择颜色"
          request={async () => [
            { label: '全部', value: 'all' },
            { label: '未解决', value: 'open' },
            { label: '已解决', value: 'closed' },
            { label: '解决中', value: 'processing' }
          ]}
        ></ProFormSelect>
        <ProFormSelect
          name={'unit'}
          placeholder="请选择规格"
          request={async () => [
            { label: '全部', value: 'all' },
            { label: '未解决', value: 'open' },
            { label: '已解决', value: 'closed' },
            { label: '解决中', value: 'processing' }
          ]}
        ></ProFormSelect>
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

      <EditableProTable
        className={'sku-table'}
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
