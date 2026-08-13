import { Button } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

// O header é sticky, por isso um scrollIntoView simples esconde o topo da
// secção por baixo dele — este offset compensa a altura do header.
const HEADER_OFFSET = 90;

function scrollToSection(id) {
  const el = document.getElementById(id);

  if (!el) return;

  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;

  window.scrollTo({ top, behavior: "smooth" });
}

export default function PublicHeader() {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-[#EEEEEE] sticky top-0 z-10">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between px-10 py-5">
        <span className="text-2xl font-bold text-black">
          Plataforma de registo
        </span>

        <div className="hidden md:flex items-center gap-10">
          <span
            className="font-semibold text-black cursor-pointer"
            onClick={() => scrollToSection("registos")}
          >
            Lista de registos
          </span>

          <span
            className="font-semibold text-black cursor-pointer"
            onClick={() => scrollToSection("estatisticas")}
          >
            Estatísticas
          </span>

          <span
            className="text-gray-400 cursor-not-allowed select-none"
            title="Brevemente"
          >
            Quem somos
          </span>
        </div>

        <Button
          type="primary"
          icon={<UserOutlined />}
          className="!bg-black !border !border-black !text-white !rounded-[29px] !h-[40px] hover:!bg-transparent hover:!text-black"
          onClick={() => navigate("/login")}
        >
          Login
        </Button>
      </div>
    </div>
  );
}
