import { useRef, useState } from 'react'
import { CloseCircleFilled, PlusOutlined } from '@ant-design/icons'
import {
  ActionType,
  ModalForm,
  PageContainer,
  ProColumns,
  ProFormDateRangePicker,
  ProFormDigit,
  ProTable
} from '@ant-design/pro-components'
import { Badge, Button, DatePicker, Form, message, Modal, Select } from 'antd'
import dayjs from 'dayjs'
import lodash from 'lodash'

import axios from '@/utils/axios.ts'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

function OperationsRule() {
  const actionRef = useRef<ActionType>()
  const [modalInfo, setModalInfo] = useState<Record<string, any>>({
    open: false,
    title: '编辑满减规则'
  })
  const [form] = Form.useForm()

  const columns: ProColumns[] = [
    {
      title: '面值',
      dataIndex: 'faceValue'
    },
    {
      title: '门槛',
      dataIndex: 'thresholdValue'
    },
    {
      title: '有效期',
      dataIndex: 'validDate',
      render: (_, row: any) => {
        const { validStartDate, validEndDate } = row
        return `${dayjs(Number(validStartDate)).format('YYYY-MM-DD')} - ${dayjs(
          Number(validEndDate)
        ).format('YYYY-MM-DD')}`
      },
      renderFormItem: () => {
        return <DatePicker.RangePicker inputReadOnly />
      }
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      render: (status) => {
        const color = status ? 'blue' : 'red'
        return [<Badge key={color} color={color} text={status ? '有效' : '失效'} />]
      },
      renderFormItem: () => {
        return (
          <Select
            placeholder={'请选择'}
            allowClear={{
              clearIcon: <CloseCircleFilled />
            }}
            options={[
              { value: true, label: '有效' },
              { value: false, label: '失效' }
            ]}
          />
        )
      }
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      ellipsis: false,
      width: 80,
      render: (_, record) => {
        return [
          perms.includes('edit-rule') && record.isActive && (
            <a
              key="modify"
              onClick={() => {
                const { validStartDate, validEndDate, ...other } = record
                form.setFieldsValue({
                  ...other,
                  validDate: [dayjs(Number(validStartDate)), dayjs(Number(validEndDate))]
                })
                setModalInfo({
                  open: true,
                  title: '编辑满减规则码'
                })
              }}
            >
              编辑
            </a>
          ),
          perms.includes('delete-rule') && (
            <a
              key="delete"
              onClick={() => {
                confirm({
                  title: '确认操作',
                  content: '确认删除满减规则吗?',
                  onOk: async () => {
                    await handleDelete(record)
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

  const handleUpdate = async (data: any) => {
    const id = form.getFieldValue('id')
    const { validDate, ...other } = data
    await axios
      .post(`/rule/${id ? 'update' : 'create'}`, {
        id: id || undefined,
        ...other,
        validStartDate: dayjs(validDate[0]).valueOf(),
        validEndDate: dayjs(validDate[1]).valueOf()
      })
      .then(async () => {
        message.success(`满减规则${id ? '编辑' : '新建'}成功`)
        actionRef.current?.reloadAndRest?.()
        setModalInfo({
          open: false
        })
      })
  }

  const handleDelete = async (data: any) => {
    await axios.get(`/rule/delete/${data.id}`).then(async () => {
      message.success('删除满减规则成功')
      actionRef.current?.reloadAndRest?.()
    })
  }

  return (
    <PageContainer breadcrumbRender={false}>
      <ProTable
        search={{
          labelWidth: 'auto'
        }}
        rowKey="id"
        headerTitle="满减规则列表"
        actionRef={actionRef}
        columns={columns}
        toolBarRender={() => [
          perms.includes('add-rule') && (
            <Button
              type="primary"
              key="primary"
              onClick={() => {
                form.resetFields()
                form.setFieldsValue({
                  faceValue: '',
                  thresholdValue: '',
                  validDate: '',
                  id: ''
                })
                setModalInfo({
                  open: true,
                  title: '新建满减规则'
                })
              }}
            >
              <PlusOutlined /> 新建
            </Button>
          )
        ]}
        request={async (params) => {
          const { pageSize, current, validDate = [], faceValue, thresholdValue, ...other } = params
          const [validStartDate, validEndDate] = validDate
          const { records, total }: { records: any; total: number } = await axios.post(
            '/rule/page',
            {
              size: pageSize,
              current,
              ...(validStartDate
                ? {
                    validStartDate: dayjs(validStartDate).valueOf(),
                    validEndDate: dayjs(validEndDate).valueOf()
                  }
                : {}),
              faceValue: faceValue ? Number(faceValue) : undefined,
              thresholdValue: thresholdValue ? Number(thresholdValue) : undefined,
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

      <ModalForm<{
        faceValue: number
        thresholdValue: number
        validDate: number
      }>
        open={modalInfo.open}
        initialValues={{}}
        title={modalInfo.title}
        form={form}
        autoFocusFirstInput
        width={400}
        submitTimeout={2000}
        modalProps={{
          onCancel: () => {
            setModalInfo({ open: false })
          }
        }}
        onFinish={async (values) => {
          await handleUpdate(values)
        }}
      >
        <ProFormDigit
          min={0.01}
          fieldProps={{
            precision: 2
          }}
          name="faceValue"
          label="面值"
          placeholder={'请输入面值'}
          rules={[
            {
              required: true,
              message: '请输入面值'
            },
            () => ({
              validator(_, value) {
                if (value < 0 || isNaN(value)) {
                  return Promise.reject(new Error('请输入正整数面值'))
                }
                return Promise.resolve()
              }
            })
          ]}
        />
        <ProFormDigit
          min={0.02}
          fieldProps={{
            precision: 2
          }}
          name="thresholdValue"
          label="门槛"
          placeholder={'请输入门槛'}
          rules={[
            {
              required: true,
              message: '请输入门槛'
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (value < 0 || isNaN(value)) {
                  return Promise.reject(new Error('请输入正整数门槛'))
                }
                if (getFieldValue('faceValue') >= value) {
                  return Promise.reject(new Error('门槛值必须大于面值'))
                }
                return Promise.resolve()
              }
            })
          ]}
        />
        <ProFormDateRangePicker
          width={368}
          name="validDate"
          label="有效期"
          rules={[
            {
              required: true,
              message: '请选择有效期'
            }
          ]}
          fieldProps={{
            disabledDate: (current) => {
              return current && current < dayjs().endOf('day')
            }
          }}
        />
      </ModalForm>
    </PageContainer>
  )
}

export default OperationsRule
