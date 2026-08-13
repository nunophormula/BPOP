import { useContext } from "react";

import { Context } from "../utils/context";

import loginBg from "../assets/login/Login-Background.png";
import { Spin } from "antd";

const Loading = () => {
  const { isLoading } = useContext(Context);

  return (
    <div
      className={`flex flex-col justify-center items-center w-full h-full bg-cover bg-center`}
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="max-w-[450px] w-full min-h-[300px] bg-white rounded-[5px] shadow-[0px_3px_6px_#00000029]">
        <div className="flex flex-col justify-center items-center h-full p-4">
          <Spin spinning={isLoading} />
          <p className="mt-4">A carregar...</p>
        </div>
      </div>
    </div>
  );
};
export default Loading;
