function Sidebar({ users }) {
    return (
        <div className="w-80 h-screen border-r border-gray-300 p-4">

            <h2 className="text-2xl font-bold mb-6">
                Users
            </h2>

            <div className="space-y-3">

                {users.map((user) => (

                    <div
                        key={user._id}
                        className="p-3 rounded-lg border cursor-pointer hover:bg-gray-100 transition"
                    >
                        <h3 className="font-semibold">
                            {user.username}
                        </h3>

                        <p className="text-sm text-gray-500">
                            {user.email}
                        </p>

                    </div>

                ))}

            </div>

        </div>
    );
}

export default Sidebar;