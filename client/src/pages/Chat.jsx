import { useEffect, useState } from "react";
import { getUsers } from "../services/userService";
import Loader from "../components/Loader";
import Sidebar from "../components/Sidebar";
function Chat() {

  const [users, setUsers] = useState([]);

  useEffect(() => {

    fetchUsers();

  }, []);

  const fetchUsers = async () => {

    try {

      const data = await getUsers();

      console.log(data);

      setUsers(data.users);

    } catch (error) {

      console.error(error.message);

    }

  };

  return (
    <div className="flex">

      <Sidebar users={users} />

      <div className="flex-1 flex items-center justify-center">

        <h1 className="text-3xl font-bold">
          Chat Area
        </h1>

      </div>

    </div>
  );
}
export default Chat;