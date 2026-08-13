function EditableTable({ rows }) {
  if (!rows || !rows.length) return null;

  const columns = Object.keys(rows[0]).map(key => ({
    title: key,
    dataIndex: key,
    render: (_, record, rowIndex) => (
      <Form.Item
        name={["tables", key, rowIndex]}
        initialValue={record[key]}
        className="!mb-0"
      >
        <Input />
      </Form.Item>
    )
  }));

  const dataSource = rows.map((r, i) => ({ key: i, ...r }));

  return (
    <div className="ml-6">
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        bordered
        size="small"
      />
    </div>
  );
}
