import { useRef, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { ActionType, FooterToolbar, ProColumns, ProTable } from '@ant-design/pro-components'
import { Button } from 'antd'

import type { TableListItem, TableListPagination } from './data'

import './style.scss'

function Order() {
  // const [currentRow, setCurrentRow] = useState<TableListItem>()
  const actionRef = useRef<ActionType>()
  const [selectedRowsState, setSelectedRows] = useState<TableListItem[]>([])

  const defaultData = new Array(30).fill({
    name: '1111',
    desc: '2222',
    callNo: 12,
    status: '1',
    updatedAt: '12323'
  })

  const columns: ProColumns<TableListItem>[] = [
    {
      title: '规则名称',
      dataIndex: 'name',
      tip: '规则名称是唯一的 key',
      render: (dom) => {
        return (
          <a
            onClick={() => {
              console.log(123)
            }}
          >
            {dom}
          </a>
        )
      }
    },
    {
      title: '描述',
      dataIndex: 'desc',
      valueType: 'textarea'
    },
    {
      title: '服务调用次数',
      dataIndex: 'callNo',
      sorter: true,
      hideInForm: true,
      renderText: (val: string) => `${val}万`
    },
    {
      title: '状态',
      dataIndex: 'status',
      hideInForm: true,
      valueEnum: {
        0: {
          text: '关闭',
          status: 'Default'
        },
        1: {
          text: '运行中',
          status: 'Processing'
        },
        2: {
          text: '已上线',
          status: 'Success'
        },
        3: {
          text: '异常',
          status: 'Error'
        }
      }
    },
    {
      title: '上次调度时间',
      sorter: true,
      dataIndex: 'updatedAt',
      valueType: 'dateTime'
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_) => [
        <a
          key="config"
          onClick={() => {
            console.log('操作')
          }}
        >
          配置
        </a>,
        <a key="subscribeAlert" href="https://procomponents.ant.design/">
          订阅警报
        </a>
      ]
    }
  ]

  return (
    <>
      <ProTable<TableListItem, TableListPagination>
        headerTitle="查询表格"
        actionRef={actionRef}
        defaultData={defaultData}
        rowKey="key"
        search={{
          labelWidth: 120
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              console.log('toolBarRender')
            }}
          >
            <PlusOutlined /> 新建
          </Button>
        ]}
        // request={rule}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows)
          }
        }}
      />
      {selectedRowsState?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              已选择
              <a
                style={{
                  fontWeight: 600
                }}
              >
                {selectedRowsState.length}
              </a>
              项 &nbsp;&nbsp;
              <span>
                服务调用次数总计 {selectedRowsState.reduce((pre, item) => pre + item.callNo!, 0)} 万
              </span>
            </div>
          }
        >
          <Button
            onClick={async () => {
              console.log(432)
              setSelectedRows([])
              actionRef.current?.reloadAndRest?.()
            }}
          >
            批量删除
          </Button>
          <Button type="primary">批量审批</Button>
        </FooterToolbar>
      )}

      {/*<UpdateForm*/}
      {/*  onSubmit={async (value) => {*/}
      {/*    const success = await handleUpdate(value, currentRow)*/}

      {/*    if (success) {*/}
      {/*      handleUpdateModalVisible(false)*/}
      {/*      setCurrentRow(undefined)*/}

      {/*      if (actionRef.current) {*/}
      {/*        actionRef.current.reload()*/}
      {/*      }*/}
      {/*    }*/}
      {/*  }}*/}
      {/*  onCancel={() => {*/}
      {/*    handleUpdateModalVisible(false)*/}
      {/*    setCurrentRow(undefined)*/}
      {/*  }}*/}
      {/*  updateModalVisible={updateModalVisible}*/}
      {/*  values={currentRow || {}}*/}
      {/*/>*/}

      {/*<Drawer*/}
      {/*  width={600}*/}
      {/*  visible={showDetail}*/}
      {/*  onClose={() => {*/}
      {/*    setCurrentRow(undefined);*/}
      {/*    setShowDetail(false);*/}
      {/*  }}*/}
      {/*  closable={false}*/}
      {/*>*/}
      {/*  {currentRow?.name && (*/}
      {/*    <ProDescriptions<TableListItem>*/}
      {/*      column={2}*/}
      {/*      title={currentRow?.name}*/}
      {/*      request={async () => ({*/}
      {/*        data: currentRow || {},*/}
      {/*      })}*/}
      {/*      params={{*/}
      {/*        id: currentRow?.name,*/}
      {/*      }}*/}
      {/*      columns={columns as ProDescriptionsItemProps<TableListItem>[]}*/}
      {/*    />*/}
      {/*  )}*/}
      {/*</Drawer>*/}
    </>
  )
}

export default Order
