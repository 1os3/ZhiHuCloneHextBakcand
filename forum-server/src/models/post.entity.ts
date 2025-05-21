import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Comment } from './comment.entity';
import { Tag } from './tag.entity';
import { Report } from './report.entity';

/**
 * 帖子状态枚举
 * @swagger
 * components:
 *   schemas:
 *     PostStatus:
 *       type: string
 *       enum:
 *         - draft
 *         - pending
 *         - published
 *         - rejected
 *         - archived
 */
export enum PostStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

/**
 * 帖子实体
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 帖子唯一标识
 *         title:
 *           type: string
 *           description: 帖子标题
 *         content:
 *           type: string
 *           description: 帖子内容
 *         summary:
 *           type: string
 *           nullable: true
 *           description: 帖子摘要
 *         viewCount:
 *           type: integer
 *           description: 浏览数
 *         likeCount:
 *           type: integer
 *           description: 点赞数
 *         commentCount:
 *           type: integer
 *           description: 评论数
 *         isPinned:
 *           type: boolean
 *           description: 是否置顶
 *         pinnedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: 置顶时间
 *         isFeatured:
 *           type: boolean
 *           description: 是否精华
 *         featuredAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: 设为精华的时间
 *         status:
 *           $ref: '#/components/schemas/PostStatus'
 *         publishedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: 发布时间
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *           description: 附件列表
 *         coverImage:
 *           type: string
 *           nullable: true
 *           description: 封面图片
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *         authorId:
 *           type: string
 *           format: uuid
 *           description: 作者ID
 *         categoryId:
 *           type: string
 *           format: uuid
 *           description: 分类ID
 *       required:
 *         - id
 *         - title
 *         - content
 *         - authorId
 *         - categoryId
 */
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  commentCount: number;

  @Column({ default: false })
  isPinned: boolean;

  @Column({ nullable: true })
  pinnedAt: Date;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ nullable: true })
  featuredAt: Date;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.PUBLISHED,
  })
  status: PostStatus;

  @Column({ nullable: true })
  publishedAt: Date;

  @Column({ nullable: true, type: 'simple-array' })
  attachments: string[];

  @Column({ nullable: true })
  coverImage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => User, user => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @ManyToOne(() => Category, category => category.posts)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: string;

  @OneToMany(() => Comment, comment => comment.post)
  comments: Comment[];

  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'post_tags',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @OneToMany(() => Report, report => report.post)
  reports: Report[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'post_likes',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  likedBy: User[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'post_bookmarks',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  bookmarkedBy: User[];
}
