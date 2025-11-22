import RegisterData from "@/utils/RegisterData";
import RegisterEntry from "@/pages/EmergencyEntry";

export default function Emergency(){
    const emergencyContact = RegisterData.map((data) =>{
        return(
            <RegisterEntry
                key={data.heading.id}
                data={data}
            />
        )
    })

    return(
        <article>
            <div>
                {emergencyContact}
            </div>
        </article>
    )
}