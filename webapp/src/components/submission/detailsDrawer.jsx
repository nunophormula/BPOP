import { Drawer, Space, Divider, Table, Tag, Avatar, Card } from "antd";

import { UserOutlined, FileTextOutlined } from "@ant-design/icons";

const submissionFields = [
  {
    key: "topografia",
    label: "Modelo Tumoral",
  },
  {
    key: "plataforma",
    label: "Plataforma",
  },
  {
    key: "anticorpo",
    label: "Anticorpo",
  },
  {
    key: "produto",
    label: "Produto",
  },
  {
    key: "tumor_primario",
    label: "Tumor primário",
  },
  {
    key: "origem_amostra",
    label: "Origem da amostra",
  },
  {
    key: "percentagem_celulas_expressao",
    label: "Percentagem células expressão",
  },
  {
    key: "criterios_interpretacao",
    label: "Critérios interpretação",
  },
  {
    key: "resultado",
    label: "Resultado",
  },
];
export default function SubmissionDetailsDrawer({ open, onClose, submission }) {
  console.log(submission);
  const InfoCard = ({ label, value }) => (
    <div className="bg-white border border-[#E8E8E8] rounded-xl p-6 min-h-[130px] flex flex-col justify-center text-center">
      <div className="text-gray-400 text-sm mb-3">{label}</div>

      <p className="text-[#091B43] font-bold">{value}</p>
    </div>
  );

  return (
    <Drawer
      title="Detalhes da Submissão"
      placement="right"
      width={900}
      open={open}
      onClose={onClose}
    >
      {submission && (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div className="grid grid-cols-4 gap-4">
            <InfoCard label="Nº processo" value={submission.patient || "-"} />
            <InfoCard
              label="Nº diagnóstico"
              value={submission.diagnostic || "-"}
            />
            <InfoCard
              label="Hospital"
              value={submission?.hospital_nome || "-"}
            />
            <InfoCard
              label="Representante"
              value={submission.login_nome || "-"}
              // value={
              //   <div className="flex flex-col items-center">
              //     {/* <Avatar icon={<UserOutlined />} /> */}
              //     <span className="mt-2 font-semibold">
              //       {submission.login_nome}
              //     </span>
              //   </div>
              // }
            />
          </div>

          <div className="mt-0">
            <div className="flex items-center gap-2 mb-0">
              <FileTextOutlined className="text-orange-500" />
              <h3 className="font-semibold text-lg m-0">Dados</h3>
            </div>

            <Divider style={{ margin: "10px 0 15px 0" }} />

            <div className="grid grid-cols-1 gap-4">
              <Card className="rounded-xl">
                <div className="flex justify-between mb-8">
                  <div>
                    <div className="text-gray-500">Produto</div>

                    <div className="text-xl font-bold text-orange-500">
                      {submission.produto}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-gray-500">Resultado</div>

                    <div className="text-xl font-bold text-orange-500">
                      {submission.resultado}
                    </div>
                  </div>
                </div>

                <Divider />

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Biomarcador</span>
                    <strong>{submission.biomarcador}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Plataforma</span>
                    <strong>{submission.plataforma}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Modelo Tumoral</span>
                    <strong>{submission.topografia}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Anticorpo</span>
                    <strong>{submission.anticorpo}</strong>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {submission.items?.map((item) => {
            let data;

            try {
              data = JSON.parse(item.item_data);
            } catch (error) {
              return <div key={item.id}>Erro ao processar dados do item.</div>;
            }

            return (
              <div
                key={item.id}
                className="border-t border-gray-200 pt-6 w-full"
              >
                <h3 className="text-lg font-semibold mb-4">{data.TITLE}</h3>

                {data.CONTENT?.map((content, index) => {
                  // SUBTITLE
                  if (content.level === "subtitle") {
                    return (
                      <div key={index} className="mt-6">
                        <h4 className="ml-2 mb-4 font-semibold">
                          {content.text}
                        </h4>

                        {content.contentInside?.map((inside, i) => (
                          <div
                            key={i}
                            className="ml-6 mb-3 whitespace-pre-line text-gray-700"
                          >
                            {inside.text}
                          </div>
                        ))}
                      </div>
                    );
                  }

                  // TABLE
                  if (content.level === "table" && content.rows?.length > 0) {
                    return (
                      <Table
                        key={index}
                        className="ml-2"
                        dataSource={content.rows}
                        columns={Object.keys(content.rows[0] || {}).map(
                          (key) => ({
                            title: key,
                            dataIndex: key,
                            key,
                          })
                        )}
                        pagination={false}
                        rowKey={(row, i) => i}
                        size="small"
                        style={{ marginBottom: 16 }}
                      />
                    );
                  }

                  // DEFAULT TEXT
                  return (
                    <div
                      key={index}
                      className="ml-6 mb-3 whitespace-pre-line text-gray-700"
                    >
                      {content.text}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </Space>
      )}
    </Drawer>
  );
}
