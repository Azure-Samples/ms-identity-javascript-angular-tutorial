import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountSwitchComponentComponent } from './account-switch-component.component';

describe('AccountSwitchComponentComponent', () => {
  let component: AccountSwitchComponentComponent;
  let fixture: ComponentFixture<AccountSwitchComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AccountSwitchComponentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountSwitchComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
