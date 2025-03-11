import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectTopicComponent } from './object-topic.component';

describe('ObjectTopicComponent', () => {
  let component: ObjectTopicComponent;
  let fixture: ComponentFixture<ObjectTopicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ObjectTopicComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectTopicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
