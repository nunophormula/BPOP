import { useState, useEffect, useContext } from "react";
import { Table, message, Button, Avatar, Tooltip, Input } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import endpoints from "../../../utils/endpoints";
import { Context } from "../../../utils/context";
import { useHospitalId, useHospitalBasePath } from "../../../utils/hospitalId";
import {
  PlusOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";

import csvIcon from "../../../assets/submission/Icone-CSV.svg";
import pdfIcon from "../../../assets/submission/icone-pdf.svg";
import SubmissionDetailsDrawer from "../../../components/submission/detailsDrawer";

export default function ProcessHospitalList() {
  const { user } = useContext(Context);
  const hospitalId = useHospitalId();
  const basePath = useHospitalBasePath();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [hospital, setHospital] = useState("");
  const [searchText, setSearchText] = useState("");
  const [submissionsByProcess, setSubmissionsByProcess] = useState({});
  const [submissionsData, setSubmissionsData] = useState({});

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    if (!hospitalId) return;

    axios
      .get(endpoints.submissionHer.readProcessByHospital, {
        params: { hospital_id: hospitalId },
      })
      .then((res) => {
        if (!res.data.success) {
          message.error("Erro ao buscar submissões");
          return;
        }

        setHospital(res.data.hospital.nome);

        const submissions = res.data.data || [];

        setSubmissionsData(submissions);

        // =========================
        // GROUP BY PROCESS NUMBER
        // =========================
        const grouped = submissions.reduce((acc, item) => {
          const key = item.patient;

          if (!acc[key]) acc[key] = [];
          acc[key].push(item);

          return acc;
        }, {});

        setSubmissionsByProcess(grouped);

        // =========================
        // TABLE DATA
        // =========================
        const tableData = Object.entries(grouped)
          .map(([patient, items]) => {
            // DEDUP LOGIN USERS
            const uniqueLoginsMap = new Map();

            items.forEach((i) => {
              const id = String(i.login_id); // 🔥 normaliza

              if (!id || uniqueLoginsMap.has(id)) return;

              uniqueLoginsMap.set(id, {
                login_id: id,
                login_name: i.login_name || "Sem nome",
                login_avatar: i.login_avatar || null,
              });
            });
            console.log(items);

            return {
              patient,
              count: items.length,
              logins: Array.from(uniqueLoginsMap.values()),
              last_submission: items.reduce(
                (latest, i) =>
                  new Date(i.created_at) > new Date(latest)
                    ? i.created_at
                    : latest,
                items[0]?.created_at
              ),
            };
          })
          .sort((a, b) => b.patient.localeCompare(a.patient));

        setData(tableData);
      })
      .catch((err) => {
        console.error(err);
        message.error("Erro ao buscar submissões");
      });
  }, [hospitalId]);

  function openDrawer(record, submission) {
    record.topografia = submission.topografia;
    record.plataforma = submission.plataforma;
    record.anticorpo = submission.anticorpo;
    record.biomarcador = submission.biomarcador;
    record.produto = submission.produto;
    record.resultado = submission.resultado;
    record.diagnostic = submission.diagnostic;
    let hospitalName = hospital;
    console.log(hospitalName);
    record.hospital_nome = hospitalName;
    record.login_nome = submission.login_name;
    console.log(record);
    setSelectedSubmission(record);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setSelectedSubmission(null);
  }

  // =========================
  // INITIALS
  // =========================
  const getInitials = (name = "") => {
    const words = name.trim().split(" ").filter(Boolean);
    if (words.length === 0) return "";
    if (words.length === 1) return words[0][0]?.toUpperCase();
    return words.map((w) => w[0]?.toUpperCase()).join("");
  };

  const filteredData = data.filter((item) => {
    const search = searchText.toLowerCase();

    return (
      item.patient?.toLowerCase().includes(search) ||
      item.logins?.some((l) => l.login_name?.toLowerCase().includes(search))
    );
  });

  // =========================
  // AVATAR RENDER (FIXED)
  // =========================
  const renderAvatar = (login) => {
    const hasImage = !!login.login_avatar;

    return (
      <Avatar
        src={
          hasImage ? `http://localhost:4000${login.login_avatar}` : undefined
        }
      >
        {!hasImage && getInitials(login.login_name)}
      </Avatar>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p>
          <span className="text-xl font-bold text-black">Processos</span>{" "}
          <span className="text-xl font-regular text-black">| {hospital}</span>
        </p>

        <div className="gap-2 flex items-center">
          <Input
            placeholder="Pesquisar processos ou representantes..."
            value={searchText}
            className="!rounded-[29px] h-[42px]"
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 400 }}
            allowClear
          />

          <Button
            type="alter"
            icon={<ArrowLeftOutlined />}
            onClick={() =>
              navigate(user.role === "admin" ? "/app/hospital" : basePath)
            }
          >
            Voltar
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="!bg-[#F5702B] !rounded-[29px] !h-[40px] hover:!bg-transparent hover:!text-[#F5702B]"
            onClick={() => navigate(`${basePath}/submission/create`)}
          >
            Criar submissão
          </Button>
        </div>
      </div>

      <Table
        dataSource={filteredData}
        rowKey="patient"
        columns={[
          {
            title: "Doente",
            dataIndex: "patient",
            key: "patient",
          },
          {
            title: "Submissões",
            dataIndex: "count",
            key: "count",
          },
          // {
          //   title: "Representante(s)",
          //   key: "logins",
          //   render: (_, record) => {
          //     const logins = record.logins || [];

          //     if (logins.length === 0) return null;

          //     if (logins.length === 1) {
          //       const login = logins[0];

          //       return (
          //         <div className="flex items-center gap-2">
          //           {renderAvatar(login)}
          //           <span>{login.login_name}</span>
          //         </div>
          //       );
          //     }

          //     return (
          //       <Avatar.Group maxCount={3}>
          //         {logins.map((login) => (
          //           <Tooltip key={login.login_id} title={login.login_name}>
          //             {renderAvatar(login)}
          //           </Tooltip>
          //         ))}
          //       </Avatar.Group>
          //     );
          //   },
          // },
          {
            title: "Biomarcadores",
            key: "biomarkers",
            render: (_, record) => {
              const submissions = submissionsByProcess[record.patient] || [];

              const biomarkers = [
                ...new Set(
                  submissions.map((s) => s.biomarcador).filter(Boolean)
                ),
              ];

              return biomarkers.length ? biomarkers.join(", ") : "-";
            },
          },
          {
            title: "Modelo Tumoral",
            key: "topografia",
            render: (_, record) => {
              const submissions = submissionsByProcess[record.patient] || [];

              const topografias = [
                ...new Set(
                  submissions.map((s) => s.topografia).filter(Boolean)
                ),
              ];

              return topografias.length ? topografias.join(", ") : "-";
            },
          },
          {
            title: "Última submissão",
            dataIndex: "last_submission",
            key: "last_submission",
            render: (date) => (date ? new Date(date).toLocaleString() : "-"),
          },
        ]}
        expandable={{
          expandedRowRender: (record) => {
            const submissions = submissionsByProcess[record.patient] || [];

            return (
              <Table
                dataSource={submissions}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: "Diagnóstico",
                    dataIndex: "diagnostic",
                    render: (v) => v || "-",
                  },
                  {
                    title: "Biomarcador",
                    dataIndex: "biomarcador",
                    render: (v) => v || "-",
                  },
                  {
                    title: "Produto",
                    dataIndex: "produto",
                    render: (v) => v || "-",
                  },
                  {
                    title: "Resultado",
                    dataIndex: "resultado",
                    render: (v) => v || "-",
                  },
                  {
                    title: "Representante",
                    key: "login_name",
                    render: (_, submission) => {
                      const hasAvatar = !!submission.login_avatar;

                      return (
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={
                              hasAvatar
                                ? `http://localhost:4000${submission.login_avatar}`
                                : undefined
                            }
                          >
                            {!hasAvatar && getInitials(submission.login_name)}
                          </Avatar>

                          <span>{submission.login_name}</span>
                        </div>
                      );
                    },
                  },
                  // {
                  //   title: "Data",
                  //   dataIndex: "created_at",
                  //   render: (date) => new Date(date).toLocaleString(),
                  // },
                  {
                    title: "Ações",
                    render: (_, submission) => (
                      <div className="flex items-center gap-3">
                        <Tooltip title="Ver submissão">
                          <Button
                            size="medium"
                            type="primary"
                            className="!text-[#F5702B] border border-[#F5702B] !bg-transparent !rounded-[50px] !h-[40px] !w-[40px] hover:!bg-[#F5702B] hover:!text-[#FFF]"
                            icon={<EyeOutlined />}
                            onClick={() => openDrawer(record, submission)}
                          ></Button>
                        </Tooltip>

                        {/* <Tooltip title="Editar">
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() =>
                              navigate(`/app/submission/${submission.id}/edit`)
                            }
                          />
                        </Tooltip> */}
                      </div>
                    ),
                  },
                ]}
              />
            );
          },
        }}
      />

      <SubmissionDetailsDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        submission={selectedSubmission}
      />
    </div>
  );
}
