import { FC } from 'react'
import {
  EditableProTable,
  FooterToolbar,
  ProColumnType,
  ProForm,
  ProFormDateRangePicker,
  ProFormItem,
  ProFormSelect,
  ProFormText
} from '@ant-design/pro-components'
import { Card, Col, message, Row } from 'antd'

import './style.scss'

interface TableFormDateType {
  key: string
  workId?: string
  name?: string
  department?: string
  isNew?: boolean
  editable?: boolean
}

const fieldLabels = {
  name: '仓库名',
  url: '仓库域名',
  owner: '仓库管理员',
  approver: '审批人',
  dateRange: '生效日期',
  type: '仓库类型',
  name2: '任务名',
  url2: '任务描述',
  owner2: '执行人',
  approver2: '责任人',
  dateRange2: '生效日期',
  type2: '任务类型'
}

const tableData = [
  {
    key: '1',
    workId: '00001',
    name: 'John Brown',
    department: 'New York No. 1 Lake Park'
  },
  {
    key: '2',
    workId: '00002',
    name: 'Jim Green',
    department: 'London No. 1 Lake Park'
  },
  {
    key: '3',
    workId: '00003',
    name: 'Joe Black',
    department: 'Sidney No. 1 Lake Park'
  }
]

const SeriesDetails: FC<Record<string, any>> = () => {
  const onFinish = async (values: Record<string, any>) => {
    try {
      console.log(values)
      // await fakeSubmitForm(values)
      message.success('提交成功')
    } catch {
      // console.log
    }
  }

  const columns: ProColumnType<TableFormDateType>[] = [
    {
      title: '成员姓名',
      dataIndex: 'name',
      key: 'name',
      width: '20%'
    },
    {
      title: '工号',
      dataIndex: 'workId',
      key: 'workId',
      width: '20%'
    },
    {
      title: '所属部门',
      dataIndex: 'department',
      key: 'department',
      width: '40%'
    },
    {
      title: '操作',
      key: 'action',
      valueType: 'option',
      render: (_, record: TableFormDateType, _index, action) => {
        return [
          <a
            key="eidit"
            onClick={() => {
              action?.startEditable(record.key)
            }}
          >
            编辑
          </a>
        ]
      }
    }
  ]

  return (
    <ProForm
      className={'series-details'}
      layout="vertical"
      submitter={{
        render: (_props: any, dom: any) => {
          return <FooterToolbar>{dom}</FooterToolbar>
        }
      }}
      initialValues={{ members: tableData }}
      onFinish={onFinish}
    >
      <>
        <Card title="基础信息" className={'card'} bordered={false}>
          <Row gutter={16}>
            <Col lg={6} md={12} sm={24}>
              <ProFormText
                label={fieldLabels.name}
                name="name"
                rules={[{ required: true, message: '请输入仓库名称' }]}
                placeholder="请输入仓库名称"
              />
            </Col>
            <Col xl={{ span: 6, offset: 2 }} lg={{ span: 8 }} md={{ span: 12 }} sm={24}>
              <ProFormText
                label={fieldLabels.url}
                name="url"
                rules={[{ required: true, message: '请选择' }]}
                fieldProps={{
                  style: { width: '100%' },
                  addonBefore: 'http://',
                  addonAfter: '.com'
                }}
                placeholder="请输入"
              />
            </Col>
            <Col xl={{ span: 8, offset: 2 }} lg={{ span: 10 }} md={{ span: 24 }} sm={24}>
              <ProFormSelect
                label={fieldLabels.owner}
                name="owner"
                rules={[{ required: true, message: '请选择管理员' }]}
                options={[
                  {
                    label: '付晓晓',
                    value: 'xiao'
                  },
                  {
                    label: '周毛毛',
                    value: 'mao'
                  }
                ]}
                placeholder="请选择管理员"
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col lg={6} md={12} sm={24}>
              <ProFormSelect
                label={fieldLabels.approver}
                name="approver"
                rules={[{ required: true, message: '请选择审批员' }]}
                options={[
                  {
                    label: '付晓晓',
                    value: 'xiao'
                  },
                  {
                    label: '周毛毛',
                    value: 'mao'
                  }
                ]}
                placeholder="请选择审批员"
              />
            </Col>
            <Col xl={{ span: 6, offset: 2 }} lg={{ span: 8 }} md={{ span: 12 }} sm={24}>
              <ProFormDateRangePicker
                label={fieldLabels.dateRange}
                name="dateRange"
                fieldProps={{
                  style: {
                    width: '100%'
                  }
                }}
                rules={[{ required: true, message: '请选择生效日期' }]}
              />
            </Col>
            <Col xl={{ span: 8, offset: 2 }} lg={{ span: 10 }} md={{ span: 24 }} sm={24}>
              <ProFormSelect
                label={fieldLabels.type}
                name="type"
                rules={[{ required: true, message: '请选择仓库类型' }]}
                options={[
                  {
                    label: '私密',
                    value: 'private'
                  },
                  {
                    label: '公开',
                    value: 'public'
                  }
                ]}
                placeholder="请选择仓库类型"
              />
            </Col>
          </Row>
        </Card>

        <Card title="颜色管理" className={'card'} bordered={false}>
          <ProFormItem name="colors">
            <EditableProTable<TableFormDateType>
              recordCreatorProps={{
                record: () => {
                  return {
                    key: `0${Date.now()}`
                  }
                }
              }}
              columns={columns}
              rowKey="key"
              pagination={{
                pageSize: 20
              }}
            />
          </ProFormItem>
        </Card>
      </>
    </ProForm>
  )
}

export default SeriesDetails
