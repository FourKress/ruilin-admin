import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CloseCircleFilled, PlusOutlined } from '@ant-design/icons'
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components'
import {
  Badge,
  Button,
  Col,
  Descriptions,
  Flex,
  message,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Tooltip
} from 'antd'
import lodash from 'lodash'

import axios from '@/utils/axios.ts'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

function ProductList() {
  const actionRef = useRef<ActionType>()
  const navigate = useNavigate()

  const columns: ProColumns[] = [
    {
      title: '商品名称',
      dataIndex: 'name',
      width: 140,
      render: (_, record: Record<string, any>) => {
        const { code = '', name, id } = record
        return (
          <Row style={{ height: '60px' }}>
            <Space size={'middle'}>
              <Col style={{ height: '60px' }}>
                <Flex
                  style={{ height: '60px' }}
                  vertical={true}
                  justify={'space-around'}
                  align={'start'}
                >
                  <Tooltip title={name}>
                    <Button
                      type="link"
                      style={{ padding: 0 }}
                      onClick={() => {
                        navigate(`/product/list/details/0/${id}`)
                      }}
                    >
                      {name}
                    </Button>
                  </Tooltip>

                  <Descriptions title="">
                    <Descriptions.Item label="商品编码">
                      <Tooltip title={code}>
                        <span>{code.length > 9 ? `${code.slice(0, 20)}...` : code}</span>
                      </Tooltip>
                    </Descriptions.Item>
                  </Descriptions>
                </Flex>
              </Col>
            </Space>
          </Row>
        )
      }
    },
    {
      title: '商品编码',
      dataIndex: 'code',
      hideInTable: true
    },
    {
      title: '商品规格',
      hideInSearch: true,
      ellipsis: true,
      dataIndex: 'unit',
      render: (_, record: Record<string, any>) => {
        const { unit_count = 0, color_count = 0, sku_count = 0 } = record
        return (
          <Descriptions title="" column={1}>
            <Descriptions.Item label="颜色">
              <span>{color_count}</span>
            </Descriptions.Item>
            <Descriptions.Item label="规格">
              <span>{unit_count}</span>
            </Descriptions.Item>
            <Descriptions.Item label="SKU">
              <span>{sku_count}</span>
            </Descriptions.Item>
          </Descriptions>
        )
      }
    },
    {
      title: '价格(美元)',
      hideInSearch: true,
      ellipsis: true,
      dataIndex: 'price',
      render: (_, record: Record<string, any>) => {
        return (
          <span>
            {record.min_price} - {record.max_price}
          </span>
        )
      }
    },
    {
      title: '总库存',
      hideInSearch: true,
      dataIndex: 'stock',
      render: (_, record: Record<string, any>) => {
        const { sku_count, total_stock, has_low_stock, min_stock } = record
        return (
          <Space direction={'vertical'}>
            {sku_count > 0 ? total_stock : '-'}
            {!!sku_count && has_low_stock > 0 && (
              <Tag bordered={false} color="error">
                有SKU库存紧张
              </Tag>
            )}
            {!!sku_count && min_stock === 0 && (
              <Tag bordered={false} color="warning">
                有SKU售罄
              </Tag>
            )}
          </Space>
        )
      },
      renderFormItem: () => {
        return (
          <Select
            placeholder={'请选择'}
            allowClear={{
              clearIcon: <CloseCircleFilled />
            }}
            options={[
              { value: true, label: '上架' },
              { value: false, label: '下架' }
            ]}
          />
        )
      }
    },
    {
      title: '数据状态',
      dataIndex: 'isDraft',
      defaultFilteredValue: null,
      render: (status) => {
        const color = status ? 'red' : 'blue'
        return [<Badge key={color} color={color} text={status ? '草稿' : '线上'} />]
      },
      renderFormItem: () => {
        return (
          <Select
            placeholder={'请选择'}
            allowClear={{
              clearIcon: <CloseCircleFilled />
            }}
            options={[
              { value: true, label: '草稿' },
              { value: false, label: '线上' }
            ]}
          />
        )
      }
    },
    {
      title: '商品状态',
      dataIndex: 'isActive',
      defaultFilteredValue: null,
      render: (status) => {
        const color = status ? 'blue' : 'red'
        return [<Badge key={color} color={color} text={status ? '上架中' : '已下架'} />]
      },
      renderFormItem: () => {
        return (
          <Select
            placeholder={'请选择'}
            allowClear={{
              clearIcon: <CloseCircleFilled />
            }}
            options={[
              { value: true, label: '上架' },
              { value: false, label: '下架' }
            ]}
          />
        )
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      hideInSearch: true,
      valueType: 'dateTime'
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      ellipsis: false,
      width: 100,
      render: (_, record: Record<string, any>) => {
        return [
          perms.includes('edit-product') && (
            <a
              key="modify"
              onClick={async () => {
                navigate(`/product/list/details/1/${record.id}`)
              }}
            >
              编辑
            </a>
          ),
          perms.includes('edit-product') && (
            <a
              key="active"
              onClick={() => {
                const tips = record.isActive
                  ? '此操作将导致该商品下所有的SKU下架，确认下架该商品吗?'
                  : '确认上架该商品吗?'
                confirm({
                  title: '确认操作',
                  content: tips,
                  onOk: async () => {
                    await handleActive(record)
                  }
                })
              }}
            >
              {record.isActive ? '下架' : '上架'}
            </a>
          ),
          perms.includes('delete-product') && (
            <a
              key="delete"
              onClick={() => {
                confirm({
                  title: '确认操作',
                  content: '确认删除该商品吗?',
                  onOk: async () => {
                    await axios.get(`/product/delete/${record.id}`)
                    actionRef.current?.reloadAndRest?.()
                    message.success('商品删除成功')
                  }
                })
              }}
            >
              删除
            </a>
          )
        ]
      }
    }
  ]

  const handleActive = async (data: any) => {
    await axios
      .post(`/product/active`, {
        id: data.id,
        isActive: !data.isActive
      })
      .then(async () => {
        message.success(`商品${data.isActive ? '下架' : '上架'}成功`)
        actionRef.current?.reloadAndRest?.()
      })
  }

  return (
    <PageContainer breadcrumbRender={false}>
      <ProTable
        rowKey="id"
        headerTitle="商品列表"
        actionRef={actionRef}
        columns={columns}
        search={{
          labelWidth: 'auto'
        }}
        toolBarRender={() => [
          perms.includes('add-product') && (
            <Button
              type="primary"
              key="primary"
              onClick={() => {
                navigate(`/product/list/details/1`)
              }}
            >
              <PlusOutlined /> 新建商品
            </Button>
          )
        ]}
        request={async (params) => {
          const { pageSize, current, ...other } = params
          const { records, total }: { records: any; total: number } = await axios.post(
            '/product/page',
            {
              size: pageSize,
              current,
              ...lodash.omitBy(other, (value) => !value && value !== false)
            }
          )
          return {
            data: records,
            total,
            success: true
          }
        }}
        pagination={{
          pageSize: 20,
          hideOnSinglePage: true
        }}
      />
    </PageContainer>
  )
}

export default ProductList
