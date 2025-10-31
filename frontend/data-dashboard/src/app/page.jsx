// import LikeButton from "./like-button";
import Topbar from "../components/ui/topbar";
import Sidebar from "../components/ui/sidebar"
import AddFilterButton from "../components/ui/add-filter-button";


export default function HomePage() {

    const names = ['Ada Lovelace', 'Grace Hopper', 'Margaret Hamilton'];

    return <div className="text-black">
        <h1 className=" text-[50px]">Welcome, Anhaar</h1>
        <AddFilterButton />
        <div className="bg-white rounded-lg h-125 w-full border-2 border-gray-400 flex items-center justify-center">
            <h1 className="text-xl text-grey-500 italic">Insert Graph Here</h1>
        </div>
        {/* input graphs here */}
    </div>;
}

