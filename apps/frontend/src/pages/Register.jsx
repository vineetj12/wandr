import RegisterData from "@/utils/RegisterData";
import RegisterEntry from "@/pages/RegisterEntry";




export default function Register(){
    const personalInfo = RegisterData.map((data) =>{
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
                {personalInfo}
            </div>
        </article>
    ) 
}


