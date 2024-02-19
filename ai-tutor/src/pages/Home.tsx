import { IonButton, IonCol, IonContent, IonGrid, IonHeader, IonItem, IonList, IonPage, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Home.css';
import { Tldraw } from '@tldraw/tldraw';
import { useRef, useState } from 'react';
import OpenAI from "openai";

const openai = new OpenAI({apiKey:, dangerouslyAllowBrowser: true});

const Home: React.FC = () => {
  const upload = useRef(null)
  const [files, setFiles] = useState([])
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Cogitscholar</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonGrid style={{ height: "100%" }}>
          <IonRow style={{ height: "100%" }}>
            <IonCol>
              Upload files to start, you can upload course slides, practise questions, assignments, etc.
              <br />
              
              <IonButton onClick={()=>{
                //@ts-ignore
                upload.current.click()
              }}>Upload Files</IonButton>
              <input onChange={(e)=>{ 
                setFiles([...e.target.files])
              }} type="file" multiple={true} ref={upload} hidden></input>
              <IonList>
                {
                  files.map((x, index)=>(
                    <IonItem key={index}>{x.name}</IonItem>
                  ))
                }
              </IonList>
              {
                files.length==0 || <IonButton expand='block'>Go</IonButton>
              }
            </IonCol>
            <IonCol style={{ height: "100%" }}>
              Scratch Paper
              <Tldraw />
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Home;
