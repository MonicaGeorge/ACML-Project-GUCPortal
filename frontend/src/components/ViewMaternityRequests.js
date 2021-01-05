import React,{Component} from 'react'
import axios from 'axios'
import { Button, Table } from 'react-bootstrap';
import Dropdown from 'react-bootstrap/Dropdown'
import '../css/test44.css'
// import '../css/bootstrap.min.css'
import DropdownButton from 'react-bootstrap/DropdownButton'
// import Dropdown from 'react-bootstrap/Dropdown'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import history from '../history';
import {Link,NavLink} from 'react-router-dom'
import  { Redirect } from 'react-router-dom'
import { CheckCircle, XCircle } from 'react-bootstrap-icons';
// import Button from 'react-bootstrap/Button'

class ViewMaternityRequests extends Component{
    state={
        requests:[]
        ,warning:""
    }
    componentDidMount(){
    console.log("in maternity view")
        axios.get('http://localhost:5000/academic/maternityRequest',
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
            console.log("new state= "+this.state.requests)

        }).catch(console.log("error"))
    }

         handleClick(e,value){
            e.preventDefault();
            console.log("in click "+value)
            

        }
        
        renderRequest=(request, index)=> {
            return (
                
                <tr key={request.requestID} className="reqTr" className='clickable-row' onClick={(e)=>this.handleClick(e,request.requestID)}>
                <td className="reqTd" >{request.counter}</td>
                <td className="reqTd" >{request.requestID}</td>
                <td className="reqTd" >{request.reqType}</td>
                <td className="reqTd">{request.sentBy}</td>
                <td className="reqTd">{request.sentTo}</td>
                <td className="reqTd">{request.state}</td>
                <td className="reqTd">{request.maternityDoc}</td>
                <td className="reqTd">{request.reason}</td>
                <td className="reqTd">{request.submission_date}</td>
                <td className="reqTdRes">
                {/* <Button variant="outline-success" className="buttonResponse">Accept</Button> */}
                
                <Button variant="outline-danger" className="buttonResponse3">Cancel</Button>
              </td>

                </tr>
                
            )
            }    
       
    render(){
        const reqs=this.state.requests;
        var empty=["one"]
            const reqList=reqs.length?(
            empty.map(request=>{
            console.log("in mapping "+request.reqType)
            return(

                <div className="containAll">
                
                 

                

                <div className="container containMaternityTable ">
                <Table striped bordered variant="dark" hover size="sm" className="reqTable" >
                <thead className="reqHead">
                    <tr className="reqTr">
                    <th className="reqTh">#</th>
                    <th className="reqTh">Request ID</th>
                    <th className="reqTh">Request Type</th>
                    <th className="reqTh">Sender</th>
                    <th className="reqTh">Receiver</th>
                    <th className="reqTh">State</th>
                    <th className="reqTh">Maternity Documents</th>
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

                <div className="containDrop">
                      <Dropdown as={ButtonGroup}className="buttons2" >
                <Dropdown.Toggle id="dropdown-custom-2" className="pickBtn">Request Type</Dropdown.Toggle>
                    <Dropdown.Menu className="drop2"></Dropdown.Menu>
                    <Dropdown.Menu className="super-colors">
                    <Dropdown.Item ><Link to="/ViewSickRequests">Sick Leave Requests</Link></Dropdown.Item>
                    <Dropdown.Item> <Link to="/ViewCompensationRequests">Compensation Requests</Link></Dropdown.Item>
                    <Dropdown.Item active><Link to="/ViewMaternityRequests">Maternity Leave Requests</Link></Dropdown.Item>
                    <Dropdown.Item ><Link to="/ViewSlotLinkingRequests">Slot Linking Requests</Link></Dropdown.Item>
                    <Dropdown.Item ><Link to="/ViewReplacementRequests">Replacement Requests</Link></Dropdown.Item>
                    <Dropdown.Item ><Link to="/ViewChangeRequests">Change Day-Off Requests</Link></Dropdown.Item>
             
             
                    </Dropdown.Menu>
                </Dropdown>{' '} 

                    <Dropdown as={ButtonGroup} className="buttons1">
                    <Dropdown.Toggle id="dropdown-custom-1" className="pickBtn" >State</Dropdown.Toggle>
                    <Dropdown.Menu className="drop1">
                    <Dropdown.Item ><Link to="/ViewAcceptedMaternityRequests">Accepted</Link></Dropdown.Item>
                    <Dropdown.Item><Link to="/ViewRejectedMaternityRequests">Rejected</Link></Dropdown.Item>
                    <Dropdown.Item ><Link to="/ViewPendingMaternityRequests">Pending</Link></Dropdown.Item>
                
                    
                    <Dropdown.Divider />
                    </Dropdown.Menu>
                </Dropdown>
               
              
                </div> 
                </div>
                        
            
              )
            })
        ):
        (
        <div className="center">No requests yet</div>
        )

        
        return (
            <div>
            <h3 className="maternityH">Maternity Requests</h3>
           {reqList}
           </div>
        )
    }
}

export default ViewMaternityRequests