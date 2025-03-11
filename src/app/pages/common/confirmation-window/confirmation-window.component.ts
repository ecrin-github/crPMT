import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { DataObjectService } from 'src/app/_rms/services/entities/data-object/data-object.service';
import { DtpService } from 'src/app/_rms/services/entities/dtp/dtp.service';
import { DupService } from 'src/app/_rms/services/entities/dup/dup.service';
import { PeopleService } from 'src/app/_rms/services/entities/people/people.service';
import { ProjectService } from 'src/app/_rms/services/entities/project/project.service';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';

@Component({
  selector: 'app-confirmation-window',
  templateUrl: './confirmation-window.component.html',
  styleUrls: ['./confirmation-window.component.scss']
})
export class ConfirmationWindowComponent implements OnInit {
  type: any;
  id: any;
  studyId: any;
  objectId: any;
  dtpId: any;
  dupId: any;
  peopleId: any;

  constructor(
    private activeModal: NgbActiveModal, 
    private toastr: ToastrService, 
    private dtpService: DtpService, 
    private dupService: DupService, 
    private projectService: ProjectService, 
    private studyService: StudyService, 
    private objectService: DataObjectService, 
    private peopleService: PeopleService) { }

  ngOnInit(): void {
  }

  deleteRecord() {
    switch (this.type) {
      case 'project':
        this.deleteProject();
        break;
      case 'study':
        this.deleteStudy();
        break;
      case 'dataObject':
        this.deleteDataObject();
        break;
      case 'objectInstance':
        this.deleteObjectInstance();
        break;
      case 'objectTitle':
        this.deleteObjectTitle();
        break;
      case 'objectDate':
        this.deleteObjectDate();
        break;
      case 'objectIdentifier':
        this.deleteObjectIdentifier();
        break;
      case 'objectDescription':
        this.deleteObjectDescription();
        break;
      case 'objectRight':
        this.deleteObjectRight();
        break;
      case 'objectRelationship':
        this.deleteObjectRelationship();
        break;
      case 'objectTopic':
        this.deleteObjectTopic();
        break;
      case 'objectContributor':
        this.deleteObjectContributor();
        break;
      case 'objectPreReqDtp':
        this.deletePreReqDtp();
        break;
      case 'objectEmbargo':
        this.deleteEmbargo();
        break;
      case 'people':
        this.deletePeople();
        break;
      default:
        break;
    }
  }
  deleteDtp() {
    if (localStorage.getItem('deleteDtp')) {
      localStorage.removeItem('deleteDtp');
    }
    this.dtpService.deleteDtpById(this.id).subscribe((res: any) => {
      // if (res.statusCode === 204) {
        this.toastr.success('DTP deleted successfully');
        localStorage.setItem('deleteDtp', 'true');
        this.activeModal.close('data');
      // } else {
      //   this.toastr.error(res.messages[0]);
      // }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  deleteDup() {
    if (localStorage.getItem('deleteDup')) {
      localStorage.removeItem('deleteDup');
    }
    this.dupService.deleteDupById(this.id).subscribe((res: any) => {
      // if (res.statusCode === 204) {
        this.toastr.success('DUP deleted successfully');
        localStorage.setItem('deleteDup', 'true');
        this.activeModal.close('data');
      // } else {
      //   this.toastr.error(res.messages[0]);
      // }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  deleteProject() {
    if (localStorage.getItem('projectDelete')) {
      localStorage.removeItem('projectDelete');
    }
    this.projectService.deleteProjectById(this.id).subscribe((res: any) => {
      // if (res.statusCode === 204) {
        this.toastr.success('Project deleted successfully');
        localStorage.setItem('projectDelete', 'true');
        this.activeModal.close('data');
      // } else {
      //   this.toastr.error(res.messages[0])
      // }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  deleteStudy() {
    if (localStorage.getItem('studyDelete')) {
      localStorage.removeItem('studyDelete');
    }
    this.studyService.deleteStudyById(this.id).subscribe((res: any) => {
      // if (res.statusCode === 204) {
        this.toastr.success('Study deleted successfully');
        localStorage.setItem('studyDelete', 'true');
        this.activeModal.close('data');
      // } else {
      //   this.toastr.error(res.messages[0])
      // }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  deleteDataObject() {
    if (localStorage.getItem('deleteDataObject')) {
      localStorage.removeItem('deleteDataObject');
    }
    this.objectService.deleteDataObjectById(this.id).subscribe((res: any) => {
      // if (res.statusCode === 204) {
        this.toastr.success('Data Object deleted successfully');
        localStorage.setItem('deleteDataObject', 'true');
        this.activeModal.close('data');
      // } else {
      //   this.toastr.error(res.messages[0])
      // }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  deleteObjectInstance() {
    this.objectService.deleteObjectInstance(this.id, this.objectId).subscribe((res: any) => {
      // if (res.statusCode === 204) {
        this.toastr.success('Object Instance deleted successfully');
        this.activeModal.close('data');
      // } else {
      //   this.toastr.error(res.messages[0]);
      // }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  deleteObjectTitle() {
    this.objectService.deleteObjectTitle(this.id, this.objectId).subscribe((res: any) => {
      // if (res.statusCode === 204) {
        this.toastr.success('Object Title deleted successfully');
        this.activeModal.close('data');
      // } else {
      //   this.toastr.error(res.messages[0]);
      // }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  deleteObjectDate() {
    this.objectService.deleteObjectDate(this.id, this.objectId).subscribe((res: any) => {
      // if (res.statusCode === 204) {
        this.toastr.success('Object Date deleted successfully');
        this.activeModal.close('data')
      // } else {
      //   this.toastr.error(res.messages[0]);
      // }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  deleteObjectIdentifier() {
    this.objectService.deleteObjectIdentifier(this.id, this.objectId).subscribe((res: any) => {
      // if (res.statusCode === 204) {
        this.toastr.success('Object Identifier deleted successfully');
        this.activeModal.close('data');
      // } else {
      //   this.toastr.error(res.messages[0]);
      // }
    }, error => {
      this.toastr.error(error.error.title)
    })
  }
  deleteObjectDescription() {
    this.objectService.deleteObjectDescription(this.id, this.objectId).subscribe((res: any) => {
      // if (res.statusCode === 204) {
        this.toastr.success('Object Description deleted successfully');
        this.activeModal.close('data');
      // } else {
      //   this.toastr.error(res.messages[0]);
      // }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  deleteObjectRight() {
    this.objectService.deleteObjectRight(this.id, this.objectId).subscribe((res:any) => {
      // if (res.statusCode === 204) {
        this.toastr.success('Object Right deleted successfully');
        this.activeModal.close('data');
      // } else {
      //   this.toastr.error(res.messages[0]);
      // }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  deleteObjectRelationship() {
    this.objectService.deleteObjectRelationship(this.id, this.objectId).subscribe((res: any) => {
      // if (res.statusCode === 204) {
        this.toastr.success('Object Relationship deleted successfully');
        this.activeModal.close('data');
      // } else {
      //   this.toastr.error(res.messages[0]);
      // }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  deleteObjectTopic() {
    this.objectService.deleteObjectTopic(this.id, this.objectId).subscribe((res: any) => {
      // if (res.statusCode === 204) {
        this.toastr.success('Object Topic deleted successfully');
        this.activeModal.close('data');
      // } else {
      //   this.toastr.error(res.messages[0]);
      // }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  deleteObjectContributor() {
    this.objectService.deleteObjectContributor(this.id, this.objectId).subscribe((res: any) => {
      // if (res.statusCode === 204) {
        this.toastr.success('Object Contributor deleted successfully');
        this.activeModal.close('data');
      // } else {
      //   this.toastr.error(res.messages[0]);
      // }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  deletePreReqDtp() {
    this.dtpService.deleteDtpObjectPrereq(this.id, this.dtpId).subscribe((res: any) => {
      // if (res.statusCode === 204) {
        this.toastr.success('Pre-Requisite deleted successfully');
        this.activeModal.close('data');
      // } else {
      //   this.toastr.error(res.messages[0]);
      // }
    }, error => {
      this.toastr.error(error.erro.title);
    })
  }
  deleteEmbargo() {
    this.dtpService.deleteDtpObject(this.id, this.dtpId).subscribe((res: any) => {
      // if (res.statusCode === 204) {
        this.toastr.success('Object Access details deleted successfully');
        this.activeModal.close('data');
      // }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  deletePeople() {
    this.peopleService.deletePeopleById(this.peopleId).subscribe((res: any) => {
      // if (res.statusCode === 204) {
        this.toastr.success('People deleted successfully');
        this.activeModal.close('data');
      // } else {
      //   this.toastr.error(res.messages[0]);
      // }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  closeModal() {
    this.activeModal.close();
  }
}
