import React,{Component} from 'react'
import axios from 'axios'
import { Button, Table } from 'react-bootstrap';
import Dropdown from 'react-bootstrap/Dropdown'
import '../css/test44.css'
import DropdownButton from 'react-bootstrap/DropdownButton'
// import Dropdown from 'react-bootstrap/Dropdown'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import history from '../history';
import {Link,NavLink} from 'react-router-dom'
import  { Redirect } from 'react-router-dom'
import { CheckCircle, XCircle } from 'react-bootstrap-icons';
// import Button from 'react-bootstrap/Button'

class ViewReceivedReplacementRequests extends Component{
    state={
        requests:[],
        warning:""
    }
    componentDidMount(){
    console.log("in view")
        axios.get('http://localhost:5000/academic/receivedReplacementRequest',
        {
            headers:{
                'x-auth-token':localStorage.getItem('jwtToken')
            }
        }
        ).then(res=>{
            // console.log(res.data[0].reqType)
            this.setState({requests:res.data.arr,warning:res.data.warning})
            console.log("new state= "+this.state.requests.reqType)
            console.log("new state= "+this.state.warning)
            console.log("length= "+this.state.requests.length)

        }).catch(console.log("error"))
    }

         handleClick(e,value){
            e.preventDefault();
            console.log("in click "+value)
            

        }
        
        renderRequest=(request, index)=> {
            console.log("reqState= "+request.state)
            return (
                
                <tr key={request.requestID} className="reqTrRep" class='clickable-row' onClick={(e)=>this.handleClick(e,request.requestID)}>
                <td className="reqTdRep" >{request.counter}</td>
                <td className="reqTdRep" >{request.requestID}</td>
                <td className="reqTdRep" >{request.reqType}</td>
                <td className="reqTdRep">{request.sentBy}</td>
                <td className="reqTdRep">{request.sentTo}</td>
                <td className="reqTdRep">{request.state}</td>
                <td className="reqTdSickRep">{request.slotDate}</td>
                <td className="reqTdSickRep">{request.slotNum}</td>
                <td className="reqTdSickRep">{request.slotLoc}</td>
                <td className="reqTdRep">{request.reason}</td>
                <td className="reqTdRep">{request.submission_date}</td>
                <td className="reqTdRes">
                {/* <Button variant="outline-success" className="buttonResponse">Accept</Button> */}
                
                
                <Button variant="outline-danger" className="buttonResponse3">Cancel</Button>
              </td>

                </tr>
                
            )
            }    
       skip(){

       }
       
    render(){
        const reqs=this.state.requests;
        const warning=this.state.warning;
        var reqList;
        if(warning!=="")
         reqList= <div>{warning}</div>
        else if (reqs.length>0){
        
          reqList=(
                <div className="containAllRep">

                 <div className="containDropRep">
                
                    <Dropdown as={ButtonGroup} className="buttons1">
                    <Dropdown.Toggle id="dropdown-custom-1"  >State</Dropdown.Toggle>
                    <Dropdown.Menu className="drop1">
                    <Dropdown.Item ><Link to="/ViewReceivedAcceptedReplacementRequests">Accepted</Link></Dropdown.Item>
                    <Dropdown.Item><Link to="/ViewReceivedRejectedReplacementRequests">Rejected</Link></Dropdown.Item>
                    <Dropdown.Item ><Link to="/ViewReceivedPendingReplacementRequests">Pending</Link></Dropdown.Item>
                
                    
                    <Dropdown.Divider />
                    </Dropdown.Menu>
                </Dropdown>{' '}
                <Dropdown as={ButtonGroup}className="buttons2" >
                <Dropdown.Toggle id="dropdown-custom-2" >R/S</Dropdown.Toggle>
                    <Dropdown.Menu className="drop2"></Dropdown.Menu>
                    <Dropdown.Menu className="super-colors">
                    <Dropdown.Item eventKey="1">Sent</Dropdown.Item>
                    <Dropdown.Item eventKey="2">Received</Dropdown.Item>
                
                    <Dropdown.Divider />
                    <Dropdown.Item eventKey="4" >Separated link</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
              
                </div> 

                

                <div className="containerRep containTableRep">
                <Table striped bordered hover size="sm" className="reqTable">
                <thead className="reqHead">
                    <tr className="reqTr">
                    <th className="reqTh">#</th>
                    <th className="reqTh">Request ID</th>
                    <th className="reqTh">Request Type</th>
                    <th className="reqTh">Sender</th>
                    <th className="reqTh">Receiver</th>
                    <th className="reqTh">State</th>
                    <th className="reqTh">Slot Date</th>
                    <th className="reqTh">Slot Number</th>
                    <th className="reqTh">Slot Location</th>
                    <th className="reqTh">Reason</th>
                    <th className="reqTh">Submission Date</th>
                    <th className="reqTh">Response</th>
                    </tr>
                </thead>
                <tbody className="reqBody">
                {reqs.map(this.renderRequest)}
                </tbody>
                </Table>
                </div>
                </div>
            
            
              )
            }

            else  reqList=<div>No requests yet</div>
        
       

        
        return (
           
           reqList
        )
    }
}

export default ViewReceivedReplacementRequests