import { Drawer, Space, Tag, Card } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useState } from "react";
import SubmissionDetailsDrawer from "./../submission/detailsDrawer";

export default function RepHospitalUserDetailsDrawer({ open, onClose, user }) {
  const [submissionDrawerOpen, setSubmissionDrawerOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const openSubmissionDrawer = (submission) => {
    setSelectedSubmission(submission);
    setSubmissionDrawerOpen(true);
  };

  return (
    <>
      <Drawer
        title="Detalhes do Utilizador"
        placement="right"
        width={500}
        open={open}
        onClose={onClose}
      >
        {user && (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <DetailItem label="Nome" value={user.nome} />
            <DetailItem label="Email" value={user.email} />
            <DetailItem label="Telefone" value={user.telefone} />
            <DetailItem label="Cargo" value={user.cargo} />
            <DetailItem
              label="Role"
              value={
                <Tag color={user.role === "adminHospital" ? "orange" : "blue"}>
                  {user.role === "adminHospital" ? "Admin" : "Representante"}
                </Tag>
              }
            />
            <DetailItem
              label="Estado"
              value={
                <Tag color={!user.ativo ? "green" : "red"}>
                  {!user.ativo ? "ATIVO" : "INATIVO"}
                </Tag>
              }
            />

            <div style={{ marginTop: 16, width: "100%" }}>
              <h2 style={{ marginBottom: 12, marginTop: 2 }}>
                <b>Submissões</b>
              </h2>
              {user.submissions && user.submissions.length > 0 ? (
                user.submissions.map((sub) => (
                  <Card
                    key={sub.id}
                    size="small"
                    style={{
                      marginBottom: 12,
                      backgroundColor: "#f0f2f5",
                      position: "relative", // necessário para o ícone absoluto
                    }}
                  >
                    <EyeOutlined
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        fontSize: 18,
                        cursor: "pointer",
                        color: "#1890ff",
                      }}
                      onClick={() => openSubmissionDrawer(sub)}
                    />

                    <Space
                      direction="vertical"
                      size="small"
                      style={{ width: "100%" }}
                    >
                      <DetailItem
                        label="Nº Processo"
                        value={sub.patient + " #" + sub.id}
                      />
                      <DetailItem
                        label="Data"
                        value={new Date(sub.created_at).toLocaleString(
                          "pt-PT",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      />
                    </Space>
                  </Card>
                ))
              ) : (
                <div style={{ color: "#999" }}>
                  Este utilizador ainda não tem submissões.
                </div>
              )}
            </div>
          </Space>
        )}
      </Drawer>

      <SubmissionDetailsDrawer
        open={submissionDrawerOpen}
        onClose={() => setSubmissionDrawerOpen(false)}
        submission={selectedSubmission}
      />
    </>
  );
}

/* Componente reutilizável para detalhes verticais */
function DetailItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 500 }}>{value || "-"}</div>
    </div>
  );
}
