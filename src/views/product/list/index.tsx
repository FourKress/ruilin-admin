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
        const { code = 'A10100001', name, id } = record
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
                        console.log(id)
                        navigate(`/product/list/details/${record.id}`, {
                          state: {
                            isEdit: false
                          }
                        })
                      }}
                    >
                      {name}
                    </Button>
                  </Tooltip>

                  <Descriptions title="">
                    <Descriptions.Item label="商品编码">
                      <Tooltip title={`商品编码: ${code}`}>
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
      render: () => {
        return <span>unit</span>
      }
    },
    {
      title: '价格(美元)',
      hideInSearch: true,
      ellipsis: true,
      dataIndex: 'price',
      render: () => {
        return <span>price</span>
      }
    },
    {
      title: '总库存',
      hideInSearch: true,
      dataIndex: 'stock',
      render: () => {
        return <span>stock</span>
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
      title: '30日销量',
      hideInSearch: true,
      dataIndex: 'salesRang',
      render: () => {
        return <span>12322222</span>
      }
    },
    {
      title: '累计销量',
      hideInSearch: true,
      dataIndex: 'sales',
      render: () => {
        return <span>123</span>
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
      width: 80,
      render: (_, record: Record<string, any>) => {
        return [
          perms.includes('edit-product') && (
            <a
              key="modify"
              onClick={async () => {
                navigate(`/product/list/details/${record.id}`, {
                  state: {
                    isEdit: true
                  }
                })
              }}
            >
              编辑
            </a>
          ),
          perms.includes('edit-product') && (
            <a
              key="active"
              onClick={() => {
                if (!record.isComplete) {
                  confirm({
                    title: '确认操作',
                    content: '请先编辑完善相关信息后再上架',
                    onOk() {
                      navigate(`/product/list/details/${record.id}`, {
                        state: {
                          isEdit: true
                        }
                      })
                    }
                  })
                  return
                }
                const tips = record.isActive
                  ? '此操作将导致该商品下所有的SKU下架，确认下架该商品吗?'
                  : '确认上架该商品吗?'
                confirm({
                  title: '确认操作',
                  content: tips,
                  onOk() {
                    handleActive(record)
                  }
                })
              }}
            >
              {record.isActive ? '下架' : '上架'}
            </a>
          )
        ]
      }
    }
  ]

  const handleActive = (data: any) => {
    axios
      .post(`/product/active`, {
        id: data.id,
        isActive: !data.isActive
      })
      .then(async () => {
        message.success('产品系列状态修改成功')
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
                navigate(`/product/list/details`, {
                  state: {
                    isEdit: true
                  }
                })
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
